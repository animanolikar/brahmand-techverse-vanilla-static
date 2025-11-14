"use strict";

const { findSessionWithUser } = require("../services/sessionService");
const { parseCookies } = require("../utils/cookies");

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "admin_session";

async function authSession(req, _res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const sessionToken = cookies[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      req.user = null;
      return next();
    }

    const payload = await findSessionWithUser(sessionToken);
    if (!payload) {
      req.user = null;
      return next();
    }

    req.session = payload.session;
    req.user = payload.user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  authSession,
  SESSION_COOKIE_NAME,
};

