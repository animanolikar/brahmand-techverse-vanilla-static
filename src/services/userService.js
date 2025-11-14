"use strict";

const { pool } = require("../config/db");
const { getScopesForRole } = require("../config/rbac");

function normalizeScopes(scopesJson, roleName) {
  if (!scopesJson) {
    return getScopesForRole(roleName);
  }

  try {
    const parsed = JSON.parse(scopesJson);
    return Array.isArray(parsed) ? parsed : getScopesForRole(roleName);
  } catch {
    return getScopesForRole(roleName);
  }
}

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  const roleName = row.role_name || row.role || "viewer";
  return {
    id: row.id,
    email: row.email,
    role: roleName,
    scopes: normalizeScopes(row.role_scopes, roleName),
    mfaEnabled: Boolean(row.mfa_enabled),
    passwordHash: row.password_hash ? row.password_hash.toString() : null,
  };
}

async function findUserByEmail(email) {
  if (!email) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT u.id,
            u.email,
            u.password_hash,
            u.mfa_enabled,
            r.name AS role_name,
            r.scopes AS role_scopes
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?
     LIMIT 1`,
    [email],
  );

  return mapUserRow(rows[0]);
}

async function findUserById(id) {
  if (!id) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT u.id,
            u.email,
            u.password_hash,
            u.mfa_enabled,
            r.name AS role_name,
            r.scopes AS role_scopes
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [id],
  );

  return mapUserRow(rows[0]);
}

module.exports = {
  findUserByEmail,
  findUserById,
};

