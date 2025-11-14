"use strict";

const { getScopesForRole } = require("../config/rbac");

function mapSessionRowToUser(row) {
  if (!row) {
    return {};
  }

  const roleName = row.role_name || "viewer";
  let scopes;
  try {
    scopes = row.role_scopes ? JSON.parse(row.role_scopes) : getScopesForRole(roleName);
  } catch {
    scopes = getScopesForRole(roleName);
  }

  return {
    session: {
      id: row.session_id,
      token: row.jwt_id,
      expires_at: row.expires_at,
      revoked_at: row.revoked_at,
    },
    user: {
      id: row.id,
      email: row.email,
      role: roleName,
      scopes,
      mfaEnabled: Boolean(row.mfa_enabled),
    },
  };
}

module.exports = {
  mapSessionRowToUser,
};

