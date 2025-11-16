"use strict";

require("./src/shims/patch-debug");

const path = require("path");
const fs = require("fs");
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");

const adminApiRouter = require("./src/routes/admin-api");
const authRouter = require("./src/routes/auth");
const { resolveSiteUrl } = require("./src/utils/site");
const { pingSearchEngines } = require("./src/services/sitemap");
const jsonBody = require("./src/middleware/jsonBody");
const { startTrendAutomation } = require("./src/services/automationScheduler");

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_DIR = path.join(__dirname, "site");
const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

app.set("trust proxy", 1);
app.set("port", PORT);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(
  jsonBody({
    limit: process.env.JSON_LIMIT || "1mb",
  }),
);
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

app.use("/api/auth", authRouter);
app.use("/api", adminApiRouter);

app.use(
  express.static(SITE_DIR, {
    extensions: ["html"],
    maxAge: ONE_WEEK_MS,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "public, max-age=300");
      } else {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      }
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/admin/ping-sitemaps", async (req, res) => {
  if (process.env.PING_TOKEN) {
    const token = req.get("x-ping-token");
    if (token !== process.env.PING_TOKEN) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  }

  const sitemapUrl = `${resolveSiteUrl(PORT)}/sitemap.xml`;
  const results = await pingSearchEngines(sitemapUrl);

  res.json({ ok: true, sitemap: sitemapUrl, results });
});

app.use((req, res) => {
  const notFoundPath = path.join(SITE_DIR, "404.html");
  if (fs.existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  return res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`🚀 Brahmand server listening on http://localhost:${PORT}`);
  if (process.env.DISABLE_TREND_AUTOMATION === "1") {
    console.log("[automation] Trend pipeline automation disabled via DISABLE_TREND_AUTOMATION");
  } else {
    startTrendAutomation();
  }
});
