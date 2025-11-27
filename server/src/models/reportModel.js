const pool = require('../config/db');

async function createReport({ reporterId, reportedId, reason }) {
  const { rows } = await pool.query(
    `INSERT INTO reports (reporter_id, reported_id, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [reporterId, reportedId, reason]
  );
  return rows[0];
}

module.exports = {
  createReport
};
