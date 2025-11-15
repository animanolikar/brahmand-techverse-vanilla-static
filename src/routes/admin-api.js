"use strict";

const express = require("express");
const multer = require("multer");
const dayjs = require("dayjs");

const { requireScopes } = require("../middleware/requireScopes");
const requireAuth = require("../middleware/requireAuth");
const { authSession } = require("../middleware/authSession");
const { resolveSiteUrl } = require("../utils/site");
const { pingSearchEngines } = require("../services/sitemap");
const {
  listArticles,
  listArticlesByRange,
  getArticleById,
  createArticle,
  updateArticle,
  updateArticleSchedule,
  publishArticle,
} = require("../services/articleService");
const { listVerses } = require("../services/verseService");
const { getSuggestedLinks } = require("../services/linkSuggester");
const { triggerBuild, listJobs } = require("../services/buildService");
const { runScheduler } = require("../services/schedulerService");
const { listMenus, createMenu, updateMenu, deleteMenu } = require("../services/menuService");
const { saveMedia, listMedia, deleteMedia } = require("../services/mediaService");
const { getSetting, upsertSetting } = require("../services/settingsService");
const { pool } = require("../config/db");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024),
  },
});

router.use(authSession);

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    time: new Date().toISOString(),
  });
});

router.post("/build", requireAuth, requireScopes("deploy:run"), (req, res) => {
  const job = triggerBuild(req.user?.id || "admin", req.body || {});
  return res.status(202).json({
    ok: true,
    message: "Static build started.",
    job,
  });
});

router.post("/sitemap/ping", requireAuth, requireScopes("sitemaps:ping"), async (req, res) => {
  const sitemapUrl = `${resolveSiteUrl(req.app.get("port"))}/sitemap.xml`;
  const results = await pingSearchEngines(sitemapUrl);

  return res.json({
    ok: true,
    sitemap: sitemapUrl,
    results,
  });
});

router.get("/jobs", requireAuth, requireScopes("jobs:run"), (_req, res) => {
  res.json({
    ok: true,
    jobs: listJobs(),
  });
});

router.post("/jobs/run", requireAuth, requireScopes("jobs:run"), (req, res) => {
  const { type = "adhoc", payload = {} } = req.body || {};
  const job = triggerBuild(req.user?.id || "admin", { type, payload });
  return res.status(202).json({
    ok: true,
    job,
    message: `Job ${type} queued.`,
  });
});

router.post("/scheduler/run", requireAuth, requireScopes("jobs:run"), async (req, res, next) => {
  try {
    const result = await runScheduler(req.user?.id || "admin");
    res.json({
      ok: true,
      published: result.published.length,
      run_at: result.run_at,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard/summary", requireAuth, async (_req, res, next) => {
  try {
    const data = await buildDashboardSummary();
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verses", requireAuth, requireScopes("content:read"), async (_req, res, next) => {
  try {
    const verses = await listVerses();
    res.json({ ok: true, verses });
  } catch (error) {
    next(error);
  }
});

router.get("/calendar/events", requireAuth, requireScopes("content:read"), async (req, res, next) => {
  try {
    const events = await listArticlesByRange(req.query.start, req.query.end);
    res.json({
      ok: true,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        verse: event.verse,
        status: event.status,
        start: event.publish_at,
        end: event.publish_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/calendar/events/:id", requireAuth, requireScopes("content:edit"), async (req, res, next) => {
  try {
    const publishAt = req.body.publish_at ? new Date(req.body.publish_at).toISOString() : null;
    const status = req.body.status;
    const article = await updateArticleSchedule(req.params.id, publishAt, status, req.user.id);
    res.json({ ok: true, article });
  } catch (error) {
    next(error);
  }
});

router.get("/articles", requireAuth, requireScopes("content:read"), async (req, res, next) => {
  try {
    const articles = await listArticles({
      verse: req.query.verse,
      status: req.query.status,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json({ ok: true, articles });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/:id", requireAuth, requireScopes("content:read"), async (req, res, next) => {
  try {
    const article = await getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ ok: false, message: "Article not found" });
    }
    res.json({ ok: true, article });
  } catch (error) {
    next(error);
  }
});

router.post("/articles", requireAuth, requireScopes("content:create"), async (req, res, next) => {
  try {
    const articleId = await createArticle(req.body, req.user.id);
    const article = await getArticleById(articleId);
    res.status(201).json({ ok: true, article });
  } catch (error) {
    next(error);
  }
});

router.patch("/articles/:id", requireAuth, requireScopes("content:edit"), async (req, res, next) => {
  try {
    await updateArticle(req.params.id, req.body, req.user.id);
    const article = await getArticleById(req.params.id);
    res.json({ ok: true, article });
  } catch (error) {
    next(error);
  }
});

router.post("/articles/:id/publish", requireAuth, requireScopes("content:publish"), async (req, res, next) => {
  try {
    const article = await publishArticle(req.params.id, req.user.id);
    triggerBuild(req.user?.id || "admin", { reason: "article_publish", article_id: article.id });
    res.json({ ok: true, article });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/:id/suggest-links", requireAuth, requireScopes("content:read"), async (req, res, next) => {
  try {
    const article = await getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ ok: false, message: "Article not found" });
    }
    const links = getSuggestedLinks(article.verse_code);
    res.json({ ok: true, links });
  } catch (error) {
    next(error);
  }
});

router.get("/articles/suggest-links", requireAuth, requireScopes("content:read"), (req, res) => {
  const links = getSuggestedLinks(req.query.verse);
  res.json({ ok: true, links });
});

router.get("/settings", requireAuth, requireScopes("settings:edit"), async (req, res, next) => {
  try {
    const key = req.query.key;
    if (!key) {
      return res.status(400).json({ ok: false, message: "Key required" });
    }
    const value = await getSetting(key, {});
    res.json({ ok: true, value });
  } catch (error) {
    next(error);
  }
});

router.post("/settings", requireAuth, requireScopes("settings:edit"), async (req, res, next) => {
  try {
    const { key, value } = req.body || {};
    if (!key) {
      return res.status(400).json({ ok: false, message: "Key required" });
    }
    await upsertSetting(key, value || {});
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/media", requireAuth, requireScopes("media:upload"), async (_req, res, next) => {
  try {
    const media = await listMedia();
    res.json({ ok: true, media });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/media",
  requireAuth,
  requireScopes("media:upload"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, message: "File required" });
      }
      const media = await saveMedia(req.file, req.user.id);
      res.status(201).json({ ok: true, media });
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/media/:id", requireAuth, requireScopes("media:upload"), async (req, res, next) => {
  try {
    await deleteMedia(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/menus", requireAuth, requireScopes("menus:edit"), async (req, res, next) => {
  try {
    const menus = await listMenus(req.query.area);
    res.json({ ok: true, menus });
  } catch (error) {
    next(error);
  }
});

router.post("/menus", requireAuth, requireScopes("menus:edit"), async (req, res, next) => {
  try {
    const menu = await createMenu(req.body);
    res.status(201).json({ ok: true, menu });
  } catch (error) {
    next(error);
  }
});

router.patch("/menus/:id", requireAuth, requireScopes("menus:edit"), async (req, res, next) => {
  try {
    const menu = await updateMenu(req.params.id, req.body);
    res.json({ ok: true, menu });
  } catch (error) {
    next(error);
  }
});

router.delete("/menus/:id", requireAuth, requireScopes("menus:edit"), async (req, res, next) => {
  try {
    await deleteMenu(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

async function buildDashboardSummary() {
  const [queueRows] = await pool.query(
    `SELECT a.id,
            a.title,
            a.status,
            a.publish_at,
            v.title AS verse_title,
            v.code AS verse_code
     FROM articles a
     LEFT JOIN verses v ON v.id = a.verse_id
     WHERE a.status IN ('review','scheduled')
     ORDER BY COALESCE(a.publish_at, a.updated_at) ASC
     LIMIT 5`,
  );

  const [overdueRows] = await pool.query(
    `SELECT a.title,
            u.email AS owner_email,
            a.updated_at
     FROM articles a
     LEFT JOIN users u ON u.id = a.updated_by
     WHERE a.status = 'review'
       AND a.updated_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)
     ORDER BY a.updated_at ASC
     LIMIT 5`,
  );

  const [statusRows] = await pool.query(
    `SELECT status, COUNT(*) AS count
     FROM articles
     GROUP BY status`,
  );
  const statusCounts = statusRows.reduce((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});

  const [published30] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM articles
     WHERE status = 'published'
       AND publish_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
  );
  const [publishedPrev30] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM articles
     WHERE status = 'published'
       AND publish_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
       AND publish_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
  );
  const [scheduledNext] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM articles
     WHERE status = 'scheduled'
       AND publish_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)`,
  );

  const [missingMeta] = await pool.query(
    `SELECT title, slug
     FROM articles
     WHERE (meta_title IS NULL OR meta_title = '')
        OR (meta_desc IS NULL OR meta_desc = '')
     ORDER BY updated_at DESC
     LIMIT 5`,
  );

  return {
    publish_queue: queueRows.map((row) => ({
      verse: row.verse_title || row.verse_code || "—",
      title: row.title,
      status: row.status,
      publish_at: row.publish_at,
    })),
    overdue_edits: overdueRows.map((row) => ({
      title: row.title,
      owner: row.owner_email || "Unassigned",
      due: row.updated_at,
    })),
    vitals: {
      lcp: `${published30[0]?.count || 0} posts (30d)`,
      cls: `${statusCounts.review || 0} in review`,
      inp: `${statusCounts.scheduled || 0} scheduled`,
      trend: `${statusCounts.draft || 0} drafts`,
    },
    revenue: {
      rpm: Number((scheduledNext[0]?.count || 0) * 12.5).toFixed(1),
      adsense: statusCounts.published || 0,
      ga4: statusCounts.review || 0,
      delta: (() => {
        const current = published30[0]?.count || 0;
        const previous = publishedPrev30[0]?.count || 0;
        if (!previous) return current ? "+100%" : "0%";
        const delta = ((current - previous) / previous) * 100;
        return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
      })(),
    },
    seo_alerts: missingMeta.map((row) => ({
      type: "meta",
      message: `${row.title} missing metadata`,
    })),
    jobs: listJobs(5),
  };
}

module.exports = router;
