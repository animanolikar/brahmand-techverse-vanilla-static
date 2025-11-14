"use strict";

const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");
const { slugify } = require("../utils/stringHelpers");

const CONTENT_ROOT = path.join(process.cwd(), "content");

function ensureContentDir(verseCode) {
  const dir = path.join(CONTENT_ROOT, verseCode);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function articleFilePath(verseCode, slug) {
  return path.join(CONTENT_ROOT, verseCode, `${slug}.md`);
}

async function listArticles(filters = {}) {
  const params = [];
  const whereClauses = [];

  if (filters.verse) {
    whereClauses.push("v.code = ?");
    params.push(filters.verse);
  }

  if (filters.status) {
    whereClauses.push("a.status = ?");
    params.push(filters.status);
  }

  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const offset = (page - 1) * pageSize;

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT a.id,
            a.slug,
            a.title,
            a.status,
            a.publish_at,
            a.updated_at,
            v.code AS verse,
            u.email AS updated_by
     FROM articles a
     INNER JOIN verses v ON v.id = a.verse_id
     LEFT JOIN users u ON u.id = a.updated_by
     ${whereSql}
     ORDER BY a.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    publish_at: row.publish_at,
    verse: row.verse,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }));
}

async function getArticleById(articleId) {
  const [rows] = await pool.query(
    `SELECT a.*, v.code AS verse_code
     FROM articles a
     INNER JOIN verses v ON v.id = a.verse_id
     WHERE a.id = ?
     LIMIT 1`,
    [articleId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  const mdPath = articleFilePath(row.verse_code, row.slug);
  let markdown = row.body_md;

  if (fs.existsSync(mdPath)) {
    markdown = fs.readFileSync(mdPath, "utf8");
  }

  return {
    ...row,
    markdown,
  };
}

async function createArticle(payload, userId) {
  const verseCode = payload.verse;
  const slug = slugify(payload.slug || payload.title);

  const [verseRows] = await pool.query(`SELECT id FROM verses WHERE code = ? LIMIT 1`, [verseCode]);
  if (!verseRows[0]) {
    throw new Error(`Unknown verse ${verseCode}`);
  }

  const verseId = verseRows[0].id;

  const markdownBody = payload.markdown || payload.body_md || "";
  const now = new Date();

  const [result] = await pool.query(
    `INSERT INTO articles (
      verse_id, slug, status, title, type, meta_title, meta_desc,
      schema_type, publish_at, body_md, html_cache, created_by, updated_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
      verseId,
      slug,
      payload.status || "draft",
      payload.title,
      payload.type || "article",
      payload.meta_title || null,
      payload.meta_desc || null,
      payload.schema_type || "none",
      payload.publish_at || null,
      markdownBody,
      userId,
      userId,
      now,
      now,
    ],
  );

  ensureContentDir(verseCode);
  fs.writeFileSync(articleFilePath(verseCode, slug), markdownBody, "utf8");

  return result.insertId;
}

async function updateArticle(articleId, payload, userId) {
  const article = await getArticleById(articleId);
  if (!article) {
    throw new Error("Article not found");
  }

  const updates = {
    title: payload.title ?? article.title,
    type: payload.type ?? article.type,
    meta_title: payload.meta_title ?? article.meta_title,
    meta_desc: payload.meta_desc ?? article.meta_desc,
    schema_type: payload.schema_type ?? article.schema_type,
    status: payload.status ?? article.status,
    publish_at: payload.publish_at ?? article.publish_at,
    body_md: payload.markdown ?? article.markdown,
  };

  await pool.query(
    `UPDATE articles
     SET title = ?, type = ?, meta_title = ?, meta_desc = ?, schema_type = ?,
         status = ?, publish_at = ?, body_md = ?, updated_by = ?, updated_at = NOW()
     WHERE id = ?`,
    [
      updates.title,
      updates.type,
      updates.meta_title,
      updates.meta_desc,
      updates.schema_type,
      updates.status,
      updates.publish_at,
      updates.body_md,
      userId,
      articleId,
    ],
  );

  ensureContentDir(article.verse_code);
  fs.writeFileSync(articleFilePath(article.verse_code, article.slug), updates.body_md, "utf8");

  return true;
}

async function publishArticle(articleId, userId) {
  const article = await getArticleById(articleId);
  if (!article) {
    throw new Error("Article not found");
  }

  const publishDate = article.publish_at || new Date();
  await pool.query(
    `UPDATE articles
     SET status = 'published',
         publish_at = ?,
         updated_by = ?,
         updated_at = NOW()
     WHERE id = ?`,
    [publishDate, userId, articleId],
  );

  return getArticleById(articleId);
}

module.exports = {
  listArticles,
  getArticleById,
  createArticle,
  updateArticle,
  publishArticle,
};
