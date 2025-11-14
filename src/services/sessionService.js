"use strict";

const crypto = require("node:crypto");
const { pool } = require("../config/db");
const { mapSessionRowToUser } = require("../utils/sessionMapper");

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 12); // 12h

async function createSession(userId, metadata = {}) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const ipBuffer = metadata.ipAddress ? Buffer.from(metadata.ipAddress) : null;
  const userAgent = metadata.userAgent?.slice(0, 512) || null;

  await pool.query(
    `INSERT INTO sessions (user_id, jwt_id, ip_address, user_agent, issued_at, expires_at)
     VALUES (?, ?, ?, ?, NOW(), ?)`,
    [userId, token, ipBuffer, userAgent, expiresAt],
  );

  return { token, expiresAt };
}

async function deleteSession(token) {
  if (!token) {
    return;
  }

  await pool.query(`DELETE FROM sessions WHERE jwt_id = ?`, [token]);
}

async function findSessionWithUser(token) {
  if (!token) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT
        s.id AS session_id,
        s.jwt_id,
        s.expires_at,
        s.revoked_at,
        u.id,
        u.email,
        u.password_hash,
        u.mfa_enabled,
        r.name AS role_name,
        r.scopes AS role_scopes
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE s.jwt_id = ?
     LIMIT 1`,
    [token],
  );

  if (!rows[0]) {
    return null;
  }

  const { session, user } = mapSessionRowToUser(rows[0]);
  if (!session || !user) {
    return null;
  }

  if (session.revoked_at) {
    return null;
  }

  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    await deleteSession(token);
    return null;
  }

  return { session, user };
}

module.exports = {
  createSession,
  deleteSession,
  findSessionWithUser,
  SESSION_TTL_MS,
};

