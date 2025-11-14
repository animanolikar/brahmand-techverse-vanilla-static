"use strict";

const DEFAULT_LIMIT = 1024 * 1024; // 1MB

function toBytes(limit) {
  if (!limit) return DEFAULT_LIMIT;
  if (typeof limit === "number" && Number.isFinite(limit)) {
    return limit;
  }

  const match = /^([0-9]+)(kb|mb|b)?$/i.exec(String(limit).trim());
  if (!match) return DEFAULT_LIMIT;

  const value = Number(match[1]);
  const unit = (match[2] || "b").toLowerCase();

  const multipliers = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
  };

  return value * (multipliers[unit] || 1);
}

function isJsonRequest(req) {
  const contentType = req.headers["content-type"] || "";
  return contentType.includes("application/json");
}

function jsonBody(options = {}) {
  const limit = toBytes(options.limit);

  return (req, res, next) => {
    if (!isJsonRequest(req)) {
      return next();
    }

    if (req.body && typeof req.body === "object") {
      return next();
    }

    let received = 0;
    const chunks = [];
    let finished = false;

    req.on("data", (chunk) => {
      if (finished) {
        return;
      }

      received += chunk.length;
      if (received > limit) {
        finished = true;
        req.destroy();
        const error = new Error("Payload too large");
        error.status = 413;
        next(error);
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (finished) {
        return;
      }
      finished = true;

      if (!chunks.length) {
        req.body = {};
        next();
        return;
      }

      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        req.body = raw ? JSON.parse(raw) : {};
      } catch (error) {
        error.status = 400;
        return next(error);
      }

      next();
    });

    req.on("error", (error) => {
      if (finished) {
        return;
      }
      finished = true;
      next(error);
    });
  };
}

module.exports = jsonBody;
