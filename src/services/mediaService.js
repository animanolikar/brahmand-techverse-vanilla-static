"use strict";

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { pool } = require("../config/db");

const MEDIA_DIR = path.join(process.cwd(), "site", "assets", "media");
const MEDIA_BASE_URL = "/assets/media";

function ensureMediaDir() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  return MEDIA_DIR;
}

function buildFileName(originalName) {
  const timestamp = Date.now();
  const cleanName = originalName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
  return `${timestamp}-${cleanName}`;
}

async function saveMedia(file, userId) {
  if (!file) {
    throw new Error("No file provided");
  }

  ensureMediaDir();

  const baseName = buildFileName(file.originalname);
  const outputPath = path.join(MEDIA_DIR, baseName);
  const webpName = baseName.replace(path.extname(baseName), ".webp");
  const webpPath = path.join(MEDIA_DIR, webpName);

  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  await image.clone().resize({ width: 1600, withoutEnlargement: true }).toFile(outputPath);
  await image.clone().webp({ quality: 80 }).toFile(webpPath);

  const [result] = await pool.query(
    `INSERT INTO media (path, width, height, mime, uploaded_by, metadata)
     VALUES (?, ?, ?, ?, ?, JSON_OBJECT('webp', ?, 'original', ?))`,
    [
      `${MEDIA_BASE_URL}/${baseName}`,
      metadata.width || null,
      metadata.height || null,
      file.mimetype,
      userId,
      `${MEDIA_BASE_URL}/${webpName}`,
      file.originalname,
    ],
  );

  return {
    id: result.insertId,
    path: `${MEDIA_BASE_URL}/${baseName}`,
    webp: `${MEDIA_BASE_URL}/${webpName}`,
    width: metadata.width || null,
    height: metadata.height || null,
    mime: file.mimetype,
    name: file.originalname,
  };
}

async function listMedia(limit = 100) {
  const [rows] = await pool.query(
    `SELECT id, path, width, height, mime, metadata, created_at
     FROM media
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => {
    let meta = {};
    if (row.metadata) {
      try {
        meta = JSON.parse(row.metadata);
      } catch {
        meta = {};
      }
    }
    return {
      id: row.id,
      path: row.path,
      webp: meta.webp,
      width: row.width,
      height: row.height,
      mime: row.mime,
      name: meta.original || path.basename(row.path),
      created_at: row.created_at,
    };
  });
}

async function deleteMedia(id) {
  const [rows] = await pool.query(`SELECT path, metadata FROM media WHERE id = ? LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) {
    throw new Error("Media not found");
  }

  const files = [row.path];
  if (row.metadata) {
    try {
      const meta = JSON.parse(row.metadata);
      if (meta.webp) files.push(meta.webp);
    } catch {
      // ignore
    }
  }

  for (const fileUrl of files) {
    if (!fileUrl) continue;
    const relPath = fileUrl.replace(MEDIA_BASE_URL, "");
    const fullPath = path.join(MEDIA_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  await pool.query(`DELETE FROM media WHERE id = ?`, [id]);
  return true;
}

module.exports = {
  saveMedia,
  listMedia,
  deleteMedia,
};
