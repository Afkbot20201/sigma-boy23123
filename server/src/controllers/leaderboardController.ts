import { Request, Response } from 'express';
import { pool } from '../config/db.js';

export async function globalLeaderboard(req: Request, res: Response) {
  const limit = Number(req.query.limit || 100);
  const offset = Number(req.query.offset || 0);
  const r = await pool.query(
    'SELECT id,username,elo_rating,rank_tier,wins,losses,draws FROM users WHERE is_banned=FALSE ORDER BY elo_rating DESC,games_played DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  res.json(r.rows);
}
