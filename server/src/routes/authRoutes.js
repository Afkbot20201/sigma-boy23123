const express = require('express');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation, handleValidationErrors } = require('../utils/validation');
const { signToken } = require('../config/auth');
const { createUser, getUserWithPasswordByEmail, findUserById } = require('../models/userModel');
const { isUserBanned } = require('../models/banModel');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await getUserWithPasswordByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ username, email, passwordHash });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ message: 'Failed to register' });
  }
});

router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserWithPasswordByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const banned = await isUserBanned(user.id);
    if (banned) {
      return res.status(403).json({ message: 'Account banned' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        elo: user.elo,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: 'Failed to login' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

module.exports = router;
