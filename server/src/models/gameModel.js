const pool = require('../config/db');

async function createGameRecord({
  id,
  whiteId,
  blackId,
  isRanked,
  timeControl,
  mode
}) {
  const { rows } = await pool.query(
    `INSERT INTO games (id, white_id, black_id, is_ranked, time_control, mode)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, whiteId, blackId, isRanked, timeControl, mode]
  );
  return rows[0];
}

async function finishGameRecord({
  id,
  result,
  pgn,
  movesJson,
  whiteEloBefore,
  blackEloBefore,
  whiteEloAfter,
  blackEloAfter,
  endedBy
}) {
  const { rows } = await pool.query(
    `UPDATE games
     SET result = $2,
         pgn = $3,
         moves_json = $4,
         white_elo_before = $5,
         black_elo_before = $6,
         white_elo_after = $7,
         black_elo_after = $8,
         ended_by = $9,
         ended_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, result, pgn, JSON.stringify(movesJson), whiteEloBefore, blackEloBefore, whiteEloAfter, blackEloAfter, endedBy]
  );
  return rows[0];
}

async function getGameById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM games WHERE id = $1`,
    [id]
  );
  return rows[0];
}

async function getGamesByUser(userId, limit = 50) {
  const { rows } = await pool.query(
    `SELECT * FROM games
     WHERE white_id = $1 OR black_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

module.exports = {
  createGameRecord,
  finishGameRecord,
  getGameById,
  getGamesByUser
};
