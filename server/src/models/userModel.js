const pool = require('../config/db');

async function createUser({ username, email, passwordHash }) {
  const client = await pool.connect();
  try {
    const role = username === 'Gifty' ? 'admin' : 'user';
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, elo, wins, losses, draws, role`,
      [username, email, passwordHash, role]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, username, email, elo, wins, losses, draws, avatar_url, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function getUserWithPasswordByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function updateStatsAfterGame({ userId, result, newElo }) {
  let wins = 0, losses = 0, draws = 0;
  if (result === 'win') wins = 1;
  if (result === 'loss') losses = 1;
  if (result === 'draw') draws = 1;
  await pool.query(
    `UPDATE users
     SET elo = $2,
         wins = wins + $3,
         losses = losses + $4,
         draws = draws + $5
     WHERE id = $1`,
    [userId, newElo, wins, losses, draws]
  );
}

async function getLeaderboard(limit = 50) {
  const { rows } = await pool.query(
    `SELECT id, username, elo, wins, losses, draws
     FROM users
     ORDER BY elo DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function updateProfile(id, { avatarUrl }) {
  const { rows } = await pool.query(
    `UPDATE users
     SET avatar_url = $2
     WHERE id = $1
     RETURNING id, username, email, elo, wins, losses, draws, avatar_url, role`,
    [id, avatarUrl]
  );
  return rows[0];
}

async function getUserStats(id) {
  const { rows } = await pool.query(
    `SELECT id, username, elo, wins, losses, draws, role
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0];
}

async function listUsers() {
  const { rows } = await pool.query(
    `SELECT id, username, email, elo, wins, losses, draws, role, created_at
     FROM users ORDER BY created_at DESC`
  );
  return rows;
}

async function resetUserElo(userId, elo = 1200) {
  await pool.query(
    `UPDATE users
     SET elo = $2, wins = 0, losses = 0, draws = 0
     WHERE id = $1`,
    [userId, elo]
  );
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getUserWithPasswordByEmail,
  updateStatsAfterGame,
  getLeaderboard,
  updateProfile,
  getUserStats,
  listUsers,
  resetUserElo
};
