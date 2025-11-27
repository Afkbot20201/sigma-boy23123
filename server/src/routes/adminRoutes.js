const express = require('express');
const { adminOnly, authRequired } = require('../middleware/authMiddleware');
const { listUsers, resetUserElo } = require('../models/userModel');
const { banUser } = require('../models/banModel');

const router = express.Router();

router.use(authRequired, adminOnly);

router.get('/users', async (req, res) => {
  const users = await listUsers();
  res.json({ users });
});

router.post('/ban', async (req, res) => {
  const { userId, reason, expiresAt } = req.body;
  const ban = await banUser({ userId, reason, expiresAt });
  res.json({ ban });
});

router.post('/reset-elo', async (req, res) => {
  const { userId, elo } = req.body;
  await resetUserElo(userId, elo || 1200);
  res.json({ success: true });
});

// Placeholder endpoints for active games and server stats;
// data returned is based on in-memory structures from WebSocket layer.
const { getActiveGamesSummary, getServerStats } = require('../sockets/gameManager');

router.get('/active-games', async (req, res) => {
  res.json({ activeGames: getActiveGamesSummary() });
});

router.get('/server-stats', async (req, res) => {
  res.json({ stats: getServerStats() });
});

module.exports = router;
