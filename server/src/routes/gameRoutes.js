const express = require('express');
const { authRequired } = require('../middleware/authMiddleware');
const { getGameById, getGamesByUser } = require('../models/gameModel');

const router = express.Router();

router.get('/my', authRequired, async (req, res) => {
  const games = await getGamesByUser(req.user.id, 50);
  res.json({ games });
});

router.get('/:id', authRequired, async (req, res) => {
  const game = await getGameById(req.params.id);
  if (!game) return res.status(404).json({ message: 'Game not found' });
  res.json({ game });
});

module.exports = router;
