"use strict";

function requireAuth(req, res, next) {
  if (req.user && req.user.id) {
    return next();
  }

  return res.status(401).json({
    ok: false,
    message: "Authentication required",
  });
}

module.exports = requireAuth;

