import express from "express";
import { getDb, saveSafe } from "../persistence.js";
import { ADMIN_API_KEY } from "../config.js";

const router = express.Router();

router.use((req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

router.get("/players", async (req, res) => {
  const db = await getDb();
  res.json(
    db.data.users.map(u => ({
      id: u.id,
      username: u.username,
      level: u.level,
      elo: u.elo,
      rank: u.rank,
      banned: u.banned
    }))
  );
});

router.post("/ban/:id", async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  user.banned = true;
  await saveSafe(db);
  res.json({ ok: true });
});

router.post("/unban/:id", async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Not found" });
  user.banned = false;
  await saveSafe(db);
  res.json({ ok: true });
});

router.post("/reset-ranks", async (req, res) => {
  const db = await getDb();
  db.data.users.forEach(u => {
    u.elo = 1000;
    u.rank = "Bronze";
  });
  await saveSafe(db);
  res.json({ ok: true });
});

router.get("/logs", async (req, res) => {
  const db = await getDb();
  res.json(db.data.logs.slice(-200));
});

export default router;
