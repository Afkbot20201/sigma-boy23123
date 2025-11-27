import { pool } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { getRankTier } from '../utils/rank.js';

export async function registerUser(username: string, email: string, password: string) {
  const exists = await pool.query('SELECT 1 FROM users WHERE username=$1 OR email=$2', [username, email]);
  if (exists.rows.length) throw new Error('Username or email in use');
  const hash = await hashPassword(password);
  const elo = 1200;
  const tier = getRankTier(elo);
  const r = await pool.query(
    'INSERT INTO users (username,email,password_hash,elo_rating,rank_tier) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [username, email, hash, elo, tier]
  );
  const user = r.rows[0];
  const token = signToken(user.id);
  return { token, user };
}

export async function loginUser(identifier: string, password: string) {
  const r = await pool.query('SELECT * FROM users WHERE email=$1 OR username=$1', [identifier]);
  if (!r.rows.length) throw new Error('Invalid credentials');
  const user = r.rows[0];
  if (user.is_banned) throw new Error('Account banned');
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');
  const token = signToken(user.id);
  return { token, user };
}
