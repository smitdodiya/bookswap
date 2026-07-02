import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// List communities split into "mine" and "discover"
router.get("/", requireAuth, async (req, res) => {
  const me = req.user.id;
  const communities = await prisma.community.findMany({
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const shaped = await Promise.all(
    communities.map(async (c) => {
      const memberIds = c.members.map((m) => m.userId);
      const bookCount = await prisma.book.count({ where: { ownerId: { in: memberIds } } });
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        memberCount: c.members.length,
        bookCount,
        members: c.members.map((m) => m.user),
        joined: memberIds.includes(me),
      };
    })
  );

  res.json({
    mine: shaped.filter((c) => c.joined),
    discover: shaped.filter((c) => !c.joined),
  });
});

// Community detail: members + combined library
router.get("/:id", requireAuth, async (req, res) => {
  const me = req.user.id;
  const community = await prisma.community.findUnique({
    where: { id: req.params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, city: true } } } },
    },
  });
  if (!community) return res.status(404).json({ error: "Community not found" });

  const memberIds = community.members.map((m) => m.userId);
  const { q = "" } = req.query;
  const term = String(q);
  const books = await prisma.book.findMany({
    where: {
      ownerId: { in: memberIds },
      ...(term
        ? { OR: [{ title: { contains: term } }, { author: { contains: term } }] }
        : {}),
    },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { title: "asc" },
  });

  res.json({
    community: {
      id: community.id,
      name: community.name,
      city: community.city,
      memberCount: community.members.length,
      bookCount: books.length,
      members: community.members.map((m) => m.user),
      joined: memberIds.includes(me),
    },
    books,
  });
});

// Join
router.post("/:id/join", requireAuth, async (req, res) => {
  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: req.user.id, communityId: req.params.id } },
    create: { userId: req.user.id, communityId: req.params.id },
    update: {},
  });
  res.json({ ok: true });
});

// Leave
router.post("/:id/leave", requireAuth, async (req, res) => {
  await prisma.communityMember.deleteMany({
    where: { userId: req.user.id, communityId: req.params.id },
  });
  res.json({ ok: true });
});

// --- Community group chat (members only) ---

async function isMember(userId, communityId) {
  const m = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
  return Boolean(m);
}

// List messages in a community's group chat
router.get("/:id/messages", requireAuth, async (req, res) => {
  if (!(await isMember(req.user.id, req.params.id)))
    return res.status(403).json({ error: "Join the community to see its chat" });

  const messages = await prisma.communityMessage.findMany({
    where: { communityId: req.params.id },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json({ messages, meId: req.user.id });
});

// Post a message to a community's group chat
router.post("/:id/messages", requireAuth, async (req, res) => {
  if (!(await isMember(req.user.id, req.params.id)))
    return res.status(403).json({ error: "Join the community to post in its chat" });

  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Empty message" });

  const message = await prisma.communityMessage.create({
    data: { communityId: req.params.id, senderId: req.user.id, body: body.trim() },
    include: { sender: { select: { id: true, name: true } } },
  });
  res.json({ message });
});

export default router;
