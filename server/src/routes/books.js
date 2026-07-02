import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Search books by title or author (partial, case-insensitive) + optional city.
// SQLite in Prisma is case-insensitive for ASCII by default with `contains`.
router.get("/search", requireAuth, async (req, res) => {
  const { q = "", city } = req.query;
  const term = String(q);
  const where = {
    ...(term
      ? { OR: [{ title: { contains: term } }, { author: { contains: term } }] }
      : {}),
    ...(city && city !== "All cities" ? { owner: { city: String(city) } } : {}),
    ownerId: { not: req.user.id }, // don't show my own books in search
  };
  const books = await prisma.book.findMany({
    where,
    include: { owner: { select: { id: true, name: true, city: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ books });
});

// Recently added near me (for the home page rail)
router.get("/recent", requireAuth, async (req, res) => {
  const books = await prisma.book.findMany({
    where: { ownerId: { not: req.user.id } },
    include: { owner: { select: { id: true, name: true, city: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  res.json({ books });
});

// Home stats
router.get("/stats", requireAuth, async (req, res) => {
  const books = await prisma.book.count();
  const readers = await prisma.user.count();
  const cityRows = await prisma.user.findMany({ select: { city: true }, distinct: ["city"] });
  res.json({ books, readers, cities: cityRows.length });
});

// Distinct cities for the filter dropdown
router.get("/cities", requireAuth, async (_req, res) => {
  const rows = await prisma.user.findMany({ select: { city: true }, distinct: ["city"] });
  res.json({ cities: rows.map((r) => r.city).sort() });
});

// Add a book to my shelf
router.post("/", requireAuth, async (req, res) => {
  const { title, author, condition, genre } = req.body;
  if (!title || !author) return res.status(400).json({ error: "Title and author required" });
  const covers = ["sage", "lavender", "beige", "terracotta", "slate"];
  const count = await prisma.book.count();
  const book = await prisma.book.create({
    data: {
      title,
      author,
      condition: condition || "Good",
      genre: genre || "Non-fiction",
      cover: covers[count % covers.length],
      ownerId: req.user.id,
    },
  });
  res.json({ book });
});

// Delete a book from my shelf
router.delete("/:id", requireAuth, async (req, res) => {
  const book = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!book || book.ownerId !== req.user.id)
    return res.status(404).json({ error: "Book not found" });
  if (book.status !== "Available")
    return res.status(400).json({ error: "You can't remove a book that's mid-swap" });
  await prisma.book.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
