import { Request, Response } from 'express';
import { pool } from '../config/db.js';

export async function getGame(req: Request, res: Response) {
  const { id } = req.params;
  const g = await pool.query('SELECT * FROM games WHERE id=$1', [id]);
  if (!g.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(g.rows[0]);
}

export async function getGameMoves(req: Request, res: Response) {
  const { id } = req.params;
  const m = await pool.query(
    'SELECT move_number,san,from_sq,to_sq,fen_after FROM game_moves WHERE game_id=$1 ORDER BY move_number ASC',
    [id]
  );
  res.json(m.rows);
}
