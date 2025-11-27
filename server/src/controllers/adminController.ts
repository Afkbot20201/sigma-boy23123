import { Request, Response } from 'express';
import { pool } from '../config/db.js';

export async function listUsers(req: Request, res: Response) {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  const r = await pool.query(
    'SELECT id,username,email,elo_rating,rank_tier,games_played,wins,losses,draws,is_banned,role FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  res.json(r.rows);
}

export async function banUser(req: Request, res: Response) {
  await pool.query('UPDATE users SET is_banned=TRUE WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}

export async function unbanUser(req: Request, res: Response) {
  await pool.query('UPDATE users SET is_banned=FALSE WHERE id=$1', [req.params.id]);
  res.json({ success: true });
}

export async function resetElo(req: Request, res: Response) {
  const { newRating } = req.body;
  const rating = newRating || 1200;
  await pool.query(
    "UPDATE users SET elo_rating=$1,rank_tier='Bronze',wins=0,losses=0,draws=0 WHERE id=$2",
    [rating, req.params.id]
  );
  res.json({ success: true });
}
