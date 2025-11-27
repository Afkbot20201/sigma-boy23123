const pool = require('../config/db');

async function banUser({ userId, reason, expiresAt }) {
  const { rows } = await pool.query(
    `INSERT INTO bans (user_id, reason, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, reason, expiresAt]
  );
  return rows[0];
}

async function isUserBanned(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM bans
     WHERE user_id = $1
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [userId]
  );
  return rows.length > 0;
}

module.exports = {
  banUser,
  isUserBanned
};
