const pool = require('../config/db');

async function getFriends(userId) {
  const { rows } = await pool.query(
    `SELECT f.id,
            u.id as friend_id,
            u.username,
            u.elo,
            f.status
     FROM friends f
     JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
     WHERE f.user_id = $1 OR f.friend_id = $1`,
    [userId]
  );
  return rows;
}

async function sendFriendRequest(userId, friendId) {
  const { rows } = await pool.query(
    `INSERT INTO friends (user_id, friend_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (user_id, friend_id) DO NOTHING
     RETURNING *`,
    [userId, friendId]
  );
  return rows[0];
}

async function acceptFriendRequest(id, userId) {
  const { rows } = await pool.query(
    `UPDATE friends
     SET status = 'accepted'
     WHERE id = $1 AND friend_id = $2
     RETURNING *`,
    [id, userId]
  );
  return rows[0];
}

async function removeFriend(id, userId) {
  await pool.query(
    `DELETE FROM friends
     WHERE id = $1 AND (user_id = $2 OR friend_id = $2)`,
    [id, userId]
  );
}

module.exports = {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend
};
