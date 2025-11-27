const express = require('express');
const { authRequired } = require('../middleware/authMiddleware');
const { findUserById, getLeaderboard, updateProfile, getUserStats } = require('../models/userModel');

const router = express.Router();

router.get('/me', authRequired, async (req, res) => {
  const user = await findUserById(req.user.id);
  res.json({ user });
});

router.get('/leaderboard', async (req, res) => {
  const leaderboard = await getLeaderboard(100);
  res.json({ leaderboard });
});

router.get('/:id', async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

router.get('/:id/stats', async (req, res) => {
  const stats = await getUserStats(req.params.id);
  if (!stats) return res.status(404).json({ message: 'User not found' });
  res.json({ stats });
});

router.put('/me', authRequired, async (req, res) => {
  const { avatarUrl } = req.body;
  const updated = await updateProfile(req.user.id, { avatarUrl });
  res.json({ user: updated });
});

module.exports = router;
