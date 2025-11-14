"use strict";

const fs = require("fs");
const path = require("path");
const { remark } = require("remark");
const remarkHtml = require("remark-html");
const remarkGfm = require("remark-gfm");
const { pool } = require("../config/db");

const SITE_ROOT = path.join(process.cwd(), "site");
const CONTENT_ROOT = path.join(process.cwd(), "content");
const SEARCH_INDEX_PATH = path.join(SITE_ROOT, "assets", "search-index.json");
const SITEMAP_PATH = path.join(SITE_ROOT, "sitemap.xml");

async function fetchPublishedArticles() {
  const [rows] = await pool.query(
    `SELECT a.id,
            a.slug,
            a.title,
            a.status,
            a.publish_at,
            a.meta_title,
            a.meta_desc,
            a.schema_type,
            a.canonical_url,
            a.body_md,
            v.code AS verse_code
     FROM articles a
     INNER JOIN verses v ON v.id = a.verse_id
     WHERE a.status = 'published'
     ORDER BY a.publish_at DESC`,
  );

  return rows;
}

async function renderMarkdown(markdown) {
  const processor = remark().use(remarkGfm).use(remarkHtml, { sanitize: false });
  const file = await processor.process(markdown || "");
  return String(file);
}

function resolveHtmlTemplate({ verse, title, body }) {
  const templatePath = path.join(SITE_ROOT, verse, "template.html");
  if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, "utf8");
    return template.replace("{{TITLE}}", title).replace("{{BODY}}", body);
  }

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <link rel="stylesheet" href="/assets/css/main.css" />
    </head>
    <body>
      <main>
        <article class="article-content">
          ${body}
        </article>
      </main>
    </body>
  </html>`;
}

async function writeHtmlFile(article, htmlBody) {
  const verseDir = path.join(SITE_ROOT, article.verse_code);
  fs.mkdirSync(verseDir, { recursive: true });
  const filePath = path.join(verseDir, `${article.slug}.html`);
  const template = resolveHtmlTemplate({
    verse: article.verse_code,
    title: article.meta_title || article.title,
    body: htmlBody,
  });
  fs.writeFileSync(filePath, template, "utf8");
  return filePath;
}

async function updateSearchIndex(entries) {
  let currentIndex = [];
  if (fs.existsSync(SEARCH_INDEX_PATH)) {
    try {
      currentIndex = JSON.parse(fs.readFileSync(SEARCH_INDEX_PATH, "utf8"));
    } catch {
      currentIndex = [];
    }
  }

  const filtered = currentIndex.filter((entry) => entry.type !== "article");
  const merged = [
    ...filtered,
    ...entries.map((entry) => ({
      title: entry.title,
      excerpt: entry.meta_desc || "",
      url: `/${entry.verse_code}/${entry.slug}.html`,
      type: "article",
    })),
  ];

  fs.mkdirSync(path.dirname(SEARCH_INDEX_PATH), { recursive: true });
  fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(merged, null, 2), "utf8");
}

async function updateSitemap(entries, siteUrl) {
  const items = entries.map((entry) => {
    const loc = `${siteUrl}/${entry.verse_code}/${entry.slug}.html`;
    const lastmod = entry.publish_at
      ? new Date(entry.publish_at).toISOString()
      : new Date().toISOString();
    return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join("\n")}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, xml, "utf8");
}

async function buildSite(siteUrl = process.env.SITE_URL || "http://localhost:3000") {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  const articles = await fetchPublishedArticles();
  const searchEntries = [];

  for (const article of articles) {
    const markdownPath = path.join(CONTENT_ROOT, article.verse_code, `${article.slug}.md`);
    let markdown = article.body_md;
    if (fs.existsSync(markdownPath)) {
      markdown = fs.readFileSync(markdownPath, "utf8");
    }

    const htmlBody = await renderMarkdown(markdown);
    await writeHtmlFile(article, htmlBody);
    searchEntries.push(article);
  }

  await updateSearchIndex(searchEntries);
  await updateSitemap(searchEntries, normalizedSiteUrl);

  return {
    count: searchEntries.length,
    generated_at: new Date().toISOString(),
  };
}

module.exports = {
  buildSite,
};

