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

// Create a community and auto-join the creator as its first member.
router.post("/", requireAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const city = String(req.body.city || "").trim();
  if (!name || !city) return res.status(400).json({ error: "Name and city are required" });

  // Avoid near-duplicate circles for the same city (case-insensitive match).
  const existing = await prisma.community.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      city: { equals: city, mode: "insensitive" },
    },
  });
  if (existing)
    return res.status(409).json({ error: "A community with that name already exists in this city" });

  const community = await prisma.community.create({
    data: { name, city, members: { create: { userId: req.user.id } } },
  });
  res.status(201).json({
    community: { id: community.id, name: community.name, city: community.city },
  });
});

// --- Community invites ---
// NOTE: these `/invites…` routes are declared before `/:id` so that the literal
// "invites" segment isn't captured as a community id.

// Invites the current user has received and not yet acted on (and hasn't
// already joined the community for on their own).
router.get("/invites", requireAuth, async (req, res) => {
  const me = req.user.id;
  const invites = await prisma.communityInvite.findMany({
    where: { inviteeId: me, status: "Pending" },
    include: {
      inviter: { select: { id: true, name: true } },
      community: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Drop invites for communities the user is already a member of.
  const myMemberships = await prisma.communityMember.findMany({
    where: { userId: me },
    select: { communityId: true },
  });
  const joinedIds = new Set(myMemberships.map((m) => m.communityId));

  res.json({
    invites: invites
      .filter((i) => !joinedIds.has(i.communityId))
      .map((i) => ({
        id: i.id,
        community: {
          id: i.community.id,
          name: i.community.name,
          city: i.community.city,
          memberCount: i.community._count.members,
        },
        inviter: i.inviter,
      })),
  });
});

// Accept an invite: join the community and mark the invite accepted.
router.post("/invites/:inviteId/accept", requireAuth, async (req, res) => {
  const invite = await prisma.communityInvite.findUnique({
    where: { id: req.params.inviteId },
  });
  if (!invite || invite.inviteeId !== req.user.id)
    return res.status(404).json({ error: "Invite not found" });

  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: req.user.id, communityId: invite.communityId } },
    create: { userId: req.user.id, communityId: invite.communityId },
    update: {},
  });
  await prisma.communityInvite.update({
    where: { id: invite.id },
    data: { status: "Accepted" },
  });
  res.json({ ok: true, communityId: invite.communityId });
});

// Decline an invite.
router.post("/invites/:inviteId/decline", requireAuth, async (req, res) => {
  const invite = await prisma.communityInvite.findUnique({
    where: { id: req.params.inviteId },
  });
  if (!invite || invite.inviteeId !== req.user.id)
    return res.status(404).json({ error: "Invite not found" });

  await prisma.communityInvite.update({
    where: { id: invite.id },
    data: { status: "Declined" },
  });
  res.json({ ok: true });
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

// People the current member can invite: everyone who isn't already a member
// and doesn't already have a pending invite to this community.
router.get("/:id/invitable", requireAuth, async (req, res) => {
  const communityId = req.params.id;
  if (!(await isMember(req.user.id, communityId)))
    return res.status(403).json({ error: "Join the community to invite others" });

  const [members, pending] = await Promise.all([
    prisma.communityMember.findMany({ where: { communityId }, select: { userId: true } }),
    prisma.communityInvite.findMany({
      where: { communityId, status: "Pending" },
      select: { inviteeId: true },
    }),
  ]);
  const excluded = new Set([
    ...members.map((m) => m.userId),
    ...pending.map((p) => p.inviteeId),
  ]);

  const users = await prisma.user.findMany({
    where: { id: { notIn: Array.from(excluded) } },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
  res.json({ users });
});

// Invite a user to this community (members only).
router.post("/:id/invite", requireAuth, async (req, res) => {
  const communityId = req.params.id;
  if (!(await isMember(req.user.id, communityId)))
    return res.status(403).json({ error: "Join the community to invite others" });

  const userId = String(req.body.userId || "");
  if (!userId) return res.status(400).json({ error: "Pick someone to invite" });

  const invitee = await prisma.user.findUnique({ where: { id: userId } });
  if (!invitee) return res.status(404).json({ error: "User not found" });

  if (await isMember(userId, communityId))
    return res.status(409).json({ error: "They're already a member" });

  // Reuse an existing invite row (e.g. one that was previously declined) so a
  // fresh invite always lands as Pending.
  const invite = await prisma.communityInvite.upsert({
    where: { communityId_inviteeId: { communityId, inviteeId: userId } },
    create: { communityId, inviteeId: userId, inviterId: req.user.id, status: "Pending" },
    update: { inviterId: req.user.id, status: "Pending" },
  });
  res.status(201).json({ invite: { id: invite.id } });
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
