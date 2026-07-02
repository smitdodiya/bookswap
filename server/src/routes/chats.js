import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Inbox: list conversations with last message preview
router.get("/", requireAuth, async (req, res) => {
  const me = req.user.id;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: me }, { receiverId: me }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, city: true } },
      receiver: { select: { id: true, name: true, city: true } },
    },
  });

  const convos = new Map();
  for (const m of messages) {
    const other = m.senderId === me ? m.receiver : m.sender;
    if (!convos.has(other.id)) {
      convos.set(other.id, {
        user: other,
        lastMessage: m.body,
        lastAt: m.createdAt,
        unread: 0,
      });
    }
    // Count messages they sent me that I haven't opened yet.
    if (m.receiverId === me && !m.readAt) convos.get(other.id).unread += 1;
  }
  res.json({ conversations: Array.from(convos.values()) });
});

// Get thread with a specific user
router.get("/:userId", requireAuth, async (req, res) => {
  const me = req.user.id;
  const other = req.params.userId;
  const otherUser = await prisma.user.findUnique({
    where: { id: other },
    select: { id: true, name: true, city: true },
  });
  if (!otherUser) return res.status(404).json({ error: "User not found" });

  // Opening the thread marks their messages to me as read.
  await prisma.message.updateMany({
    where: { senderId: other, receiverId: me, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ user: otherUser, messages, meId: me });
});

// Send a message
router.post("/:userId", requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Empty message" });
  if (req.params.userId === req.user.id)
    return res.status(400).json({ error: "You can't message yourself" });

  const recipient = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!recipient) return res.status(404).json({ error: "User not found" });

  const message = await prisma.message.create({
    data: { senderId: req.user.id, receiverId: req.params.userId, body: body.trim() },
  });
  res.json({ message });
});

export default router;
