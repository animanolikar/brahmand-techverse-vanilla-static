"use strict";

const { DEFAULT_ROLE, getScopesForRole } = require("../config/rbac");

/**
 * Temporary middleware until full auth stack is wired.
 * Reads headers to assign a role + scopes on req.user.
 */
function mockAuth(req, _res, next) {
  const roleHeader = req.get("x-user-role");
  const userRole = (roleHeader || DEFAULT_ROLE).toLowerCase();
  const userId = req.get("x-user-id") || "demo-user";

  req.user = {
    id: userId,
    role: userRole,
    scopes: getScopesForRole(userRole),
  };

  next();
}

module.exports = mockAuth;

