import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from './db.js';

export function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    pool.query('SELECT * FROM users WHERE id=$1', [payload.userId]).then(r => {
      if (!r.rows.length || r.rows[0].is_banned) return res.status(401).json({ error: 'Unauthorized' });
      req.user = r.rows[0];
      next();
    }).catch(() => res.status(500).json({ error: 'DB error' }));
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = await pool.query('SELECT 1 FROM users WHERE username=$1 OR email=$2', [username, email]);
  if (existing.rows.length) return res.status(400).json({ error: 'Username or email taken' });
  const hash = await bcrypt.hash(password, 10);
  const elo = 1200;
  const rank = 'Bronze';
  const result = await pool.query(
    'INSERT INTO users (username,email,password_hash,elo_rating,rank_tier) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [username, email, hash, elo, rank]
  );
  const token = signToken(result.rows[0].id);
  res.json({ token, user: result.rows[0] });
}

export async function login(req, res) {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing fields' });
  const r = await pool.query('SELECT * FROM users WHERE email=$1 OR username=$1', [emailOrUsername]);
  if (!r.rows.length) return res.status(400).json({ error: 'Invalid credentials' });
  const user = r.rows[0];
  if (user.is_banned) return res.status(403).json({ error: 'Banned' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = signToken(user.id);
  res.json({ token, user });
}
