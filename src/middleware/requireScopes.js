"use strict";

const normalizeScopes = (scopes) => (Array.isArray(scopes) ? scopes : [scopes]).filter(Boolean);

function hasRequiredScopes(user, requiredScopes) {
  if (!requiredScopes.length) {
    return true;
  }

  const userScopes = Array.isArray(user?.scopes) ? user.scopes : [];
  if (userScopes.includes("*")) {
    return true;
  }

  return requiredScopes.every((scope) => userScopes.includes(scope));
}

function requireScopes(requiredScopes = []) {
  const normalizedRequired = normalizeScopes(requiredScopes);

  return (req, res, next) => {
    if (hasRequiredScopes(req.user, normalizedRequired)) {
      return next();
    }

    return res.status(403).json({
      ok: false,
      message: "Insufficient permissions",
      required_scopes: normalizedRequired,
    });
  };
}

module.exports = {
  requireScopes,
  hasRequiredScopes,
};

