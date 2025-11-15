"use strict";

const { pool } = require("../config/db");

async function upsertSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (config_key, value_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = NOW()`,
    [key, JSON.stringify(value)],
  );
  return value;
}

async function getSetting(key, fallback = {}) {
  const [rows] = await pool.query(`SELECT value_json FROM settings WHERE config_key = ? LIMIT 1`, [
    key,
  ]);
  if (!rows[0]) {
    return fallback;
  }
  try {
    return JSON.parse(rows[0].value_json);
  } catch {
    return fallback;
  }
}

module.exports = {
  upsertSetting,
  getSetting,
};

