"use strict";

const express = require("express");
const { findUserByEmail } = require("../services/userService");
const { verifyPassword } = require("../utils/password");
const { createSession, deleteSession, SESSION_TTL_MS } = require("../services/sessionService");
const { serializeCookie } = require("../utils/cookies");
const { authSession, SESSION_COOKIE_NAME } = require("../middleware/authSession");

const router = express.Router();

router.use(authSession);

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Email and password are required." });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid credentials." });
  }

  const passwordValid = await verifyPassword(user.passwordHash, password);
  if (!passwordValid) {
    return res.status(401).json({ ok: false, message: "Invalid credentials." });
  }

  const session = await createSession(user.id, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: SESSION_TTL_MS,
      path: "/",
    }),
  );

  return res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      scopes: user.scopes,
    },
  });
});

router.post("/logout", async (req, res) => {
  const sessionToken = req.session?.token || null;

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  res.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 0,
      path: "/",
    }),
  );

  return res.json({ ok: true });
});

router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: "Not authenticated" });
  }

  return res.json({
    ok: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      scopes: req.user.scopes,
    },
  });
});

module.exports = router;

