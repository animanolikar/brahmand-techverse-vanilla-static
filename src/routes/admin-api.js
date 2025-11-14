"use strict";

const express = require("express");

const { requireScopes } = require("../middleware/requireScopes");
const requireAuth = require("../middleware/requireAuth");
const { authSession } = require("../middleware/authSession");
const { resolveSiteUrl } = require("../utils/site");
const { pingSearchEngines } = require("../services/sitemap");
const {
  listArticles,
  getArticleById,
  createArticle,
  updateArticle,
  publishArticle,
} = require("../services/articleService");
const { listVerses } = require("../services/verseService");
const { getSuggestedLinks } = require("../services/linkSuggester");
const { triggerBuild, listJobs } = require("../services/buildService");

const router = express.Router();

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

router.get("/dashboard/summary", requireAuth, (_req, res) => {
  res.json({
    ok: true,
    generated_at: new Date().toISOString(),
    data: buildDashboardSummary(),
  });
});

router.get("/verses", requireAuth, requireScopes("content:read"), async (_req, res, next) => {
  try {
    const verses = await listVerses();
    res.json({ ok: true, verses });
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

function buildDashboardSummary() {
  return {
    publish_queue: [
      {
        verse: "Tech",
        title: "Edge AI sensors for rail safety",
        status: "review",
        publish_at: "2024-11-08T10:00:00Z",
      },
      {
        verse: "Health",
        title: "Metabolic stacking routine",
        status: "scheduled",
        publish_at: "2024-11-08T13:00:00Z",
      },
      {
        verse: "Skill",
        title: "Storytelling drills for PMs",
        status: "draft",
        publish_at: null,
      },
    ],
    overdue_edits: [
      { title: "FinOps checklist template", owner: "Suhana", due: "2024-11-05" },
      { title: "Genome security explainer", owner: "Arav", due: "2024-11-04" },
    ],
    vitals: {
      lcp: "2.3s",
      cls: "0.08",
      inp: "180ms",
      trend: "stable",
    },
    revenue: {
      rpm: 42.7,
      adsense: 1820,
      ga4: 1290,
      delta: "+6.4%",
    },
    seo_alerts: [
      { type: "schema", message: "FAQ schema missing on 2 new posts" },
      { type: "links", message: "11 broken internal links detected" },
    ],
    jobs: listJobs(5),
  };
}

module.exports = router;
