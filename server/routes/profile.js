import express from "express";
import { authMiddleware } from "../auth.js";
import { getDb } from "../persistence.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({
    id: user.id,
    username: user.username,
    level: user.level,
    xp: user.xp,
    elo: user.elo,
    rank: user.rank,
    stats: user.stats,
    currency: user.currency,
    cosmeticsOwned: user.cosmeticsOwned,
    loadout: user.loadout
  });
});

router.get("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json({
    id: user.id,
    username: user.username,
    level: user.level,
    rank: user.rank,
    stats: user.stats
  });
});

export default router;
