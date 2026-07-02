import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import communityRoutes from "./routes/communities.js";
import lendingRoutes from "./routes/lending.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/lending", lendingRoutes);

// Unknown API routes get a JSON 404 (so they don't fall through to the SPA).
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// In production the built React app is served from this same server, so the
// client's relative `/api` calls hit us directly — no CORS or API base URL to
// configure. The client/dist folder only exists after `npm run build`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BookSwap API on http://localhost:${PORT}`));
