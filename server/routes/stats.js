import express from "express";
import { authMiddleware } from "../auth.js";
import { getDb } from "../persistence.js";

const router = express.Router();

router.get("/history", authMiddleware, async (req, res) => {
  const db = await getDb();
  const user = db.data.users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user.matches || []);
});

export default router;
