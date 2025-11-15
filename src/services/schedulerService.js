"use strict";

const dayjs = require("dayjs");
const { pool } = require("../config/db");
const { triggerBuild } = require("./buildService");

async function fetchDueScheduledArticles() {
  const [rows] = await pool.query(
    `SELECT a.id, a.slug, a.verse_id, a.publish_at
     FROM articles a
     WHERE a.status = 'scheduled' AND a.publish_at <= NOW()`,
  );
  return rows;
}

async function publishScheduledArticles(articles, userId = null) {
  if (!articles.length) {
    return [];
  }

  const published = [];
  for (const article of articles) {
    await pool.query(
      `UPDATE articles
       SET status = 'published', updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [userId, article.id],
    );
    published.push(article);
  }
  return published;
}

async function runScheduler(triggeredBy = "scheduler") {
  const dueArticles = await fetchDueScheduledArticles();
  const published = await publishScheduledArticles(dueArticles, triggeredBy);
  if (published.length) {
    triggerBuild(triggeredBy, { reason: "scheduler_publish", article_ids: published.map((a) => a.id) });
  }
  return {
    published,
    run_at: new Date().toISOString(),
  };
}

module.exports = {
  runScheduler,
};

