"use strict";

const { pool } = require("../config/db");

async function listVerses() {
  const [rows] = await pool.query(
    `SELECT id, code, title
     FROM verses
     ORDER BY sort_order ASC, title ASC`,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
  }));
}

module.exports = {
  listVerses,
};

