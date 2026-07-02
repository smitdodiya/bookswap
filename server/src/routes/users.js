import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// List all users (for "give to someone" picker)
router.get("/", requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
  res.json({ users });
});

// Get a user's profile + shelf
router.get("/:id", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, city: true, bio: true,
      books: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user, isMe: user.id === req.user.id });
});

export default router;
