import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, city: u.city, bio: u.bio,
});

// Keep city values consistent so exact-match filters (search, communities)
// don't silo "rajkot" / "Rajkot " / "RAJKOT" into separate cities.
const normalizeCity = (city) =>
  String(city || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

router.post("/signup", async (req, res) => {
  const { name, email, password, city, bio } = req.body;
  if (!name || !email || !password || !city)
    return res.status(400).json({ error: "Missing fields" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, city: normalizeCity(city), bio: bio || "" },
  });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Public list of existing cities so signup can suggest them (keeps cities tidy).
router.get("/cities", async (_req, res) => {
  const rows = await prisma.user.findMany({ select: { city: true }, distinct: ["city"] });
  res.json({ cities: rows.map((r) => r.city).sort() });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: publicUser(user) });
});

export default router;
