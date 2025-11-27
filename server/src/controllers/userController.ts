import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth.js';
import { pool } from '../config/db.js';

export async function getMe(req: AuthedRequest, res: Response) {
  const u = req.user;
  res.json(u);
}

export async function updateMe(req: AuthedRequest, res: Response) {
  const { avatarUrl } = req.body;
  const r = await pool.query(
    'UPDATE users SET avatar_url=COALESCE($1, avatar_url), updated_at=NOW() WHERE id=$2 RETURNING *',
    [avatarUrl || null, req.user!.id]
  );
  res.json(r.rows[0]);
}
