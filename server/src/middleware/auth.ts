import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { pool } from '../config/db.js';

export interface AuthedRequest extends Request {
  user?: any;
}

export async function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = hdr.slice(7);
  try {
    const { userId } = verifyToken(token);
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);
    if (!r.rows.length || r.rows[0].is_banned) return res.status(401).json({ error: 'Unauthorized' });
    req.user = r.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req: AuthedRequest, res: Response, next: NextFunction) {
  const u = req.user;
  if (!u || u.role !== 'admin' || u.username !== 'Gifty') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}
