import express from "express";
import { getDb } from "../persistence.js";

const router = express.Router();

router.get("/ranked", async (req, res) => {
  const db = await getDb();
  const top = [...db.data.users]
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 100)
    .map(u => ({
      id: u.id,
      username: u.username,
      elo: u.elo,
      rank: u.rank
    }));
  res.json(top);
});

router.get("/casual", async (req, res) => {
  const db = await getDb();
  const top = [...db.data.users]
    .sort((a, b) => b.stats.kills - a.stats.kills)
    .slice(0, 100)
    .map(u => ({
      id: u.id,
      username: u.username,
      kills: u.stats.kills
    }));
  res.json(top);
});

export default router;
