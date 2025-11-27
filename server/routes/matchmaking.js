import express from "express";
import { authMiddleware } from "../auth.js";
import { enqueuePlayer, removeFromQueues, createPrivateLobby, joinPrivateLobby } from "../matchmaking.js";

const router = express.Router();

router.post("/queue", authMiddleware, async (req, res) => {
  const { queueType, mode, partyId } = req.body;
  const entry = await enqueuePlayer({
    userId: req.user.sub,
    queueType,
    mode,
    partyId
  });
  res.json(entry);
});

router.post("/leave", authMiddleware, (req, res) => {
  removeFromQueues(req.user.sub);
  res.json({ ok: true });
});

router.post("/private/create", authMiddleware, async (req, res) => {
  const { mode } = req.body;
  const code = await createPrivateLobby(req.user.sub, mode);
  res.json({ code });
});

router.post("/private/join", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const lobby = await joinPrivateLobby(code, req.user.sub);
    res.json(lobby);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
