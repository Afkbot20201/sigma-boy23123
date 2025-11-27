const express = require('express');
const { authRequired } = require('../middleware/authMiddleware');
const { getFriends, sendFriendRequest, acceptFriendRequest, removeFriend } = require('../models/friendModel');
const { findUserByEmail } = require('../models/userModel');

const router = express.Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  const friends = await getFriends(req.user.id);
  res.json({ friends });
});

router.post('/', async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const request = await sendFriendRequest(req.user.id, user.id);
  res.json({ request });
});

router.post('/accept', async (req, res) => {
  const { id } = req.body;
  const updated = await acceptFriendRequest(id, req.user.id);
  if (!updated) return res.status(400).json({ message: 'Unable to accept' });
  res.json({ friend: updated });
});

router.delete('/:id', async (req, res) => {
  await removeFriend(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
