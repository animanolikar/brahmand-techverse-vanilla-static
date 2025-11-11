"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_DIR = path.join(__dirname, "site");
const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

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

const searchEngines = [
  { name: "Google", endpoint: "https://www.google.com/ping?sitemap=" },
  { name: "Bing", endpoint: "https://www.bing.com/ping?sitemap=" },
];

const resolveSiteUrl = () =>
  (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

app.post("/admin/ping-sitemaps", async (req, res) => {
  if (process.env.PING_TOKEN) {
    const token = req.get("x-ping-token");
    if (token !== process.env.PING_TOKEN) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }
  }

  const sitemapUrl = `${resolveSiteUrl()}/sitemap.xml`;
  const results = [];

  for (const engine of searchEngines) {
    try {
      const response = await fetch(`${engine.endpoint}${encodeURIComponent(sitemapUrl)}`);
      results.push({
        engine: engine.name,
        ok: response.ok,
        status: response.status,
      });
    } catch (error) {
      results.push({ engine: engine.name, ok: false, error: error.message });
    }
  }

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
});
