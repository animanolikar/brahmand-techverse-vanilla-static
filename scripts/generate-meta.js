"use strict";

const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "site");
const siteUrl = (process.env.SITE_URL || "https://brahmand.co").replace(/\/$/, "");

const getVerse = (relativePath) => {
  if (relativePath.startsWith("techverse/")) return "Techverse";
  if (relativePath.startsWith("finverse/")) return "Finverse";
  if (relativePath.startsWith("healthverse/")) return "Healthverse";
  if (relativePath.startsWith("skillverse/")) return "Skillverse";
  if (relativePath.startsWith("tools/")) return "Tools";
  if (relativePath.startsWith("search/")) return "Search";
  return "Core";
};

const getType = (relativePath) => {
  if (relativePath.startsWith("tools/")) return "tool";
  if (
    relativePath.startsWith("techverse/") ||
    relativePath.startsWith("finverse/") ||
    relativePath.startsWith("healthverse/") ||
    relativePath.startsWith("skillverse/")
  ) {
    return "article";
  }
  return "page";
};

const walkHtmlFiles = (dir) => {
  const entries = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const files = fs.readdirSync(current, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        stack.push(path.join(current, file.name));
      } else if (file.name.endsWith(".html")) {
        entries.push(path.join(current, file.name));
      }
    }
  }
  return entries;
};

const extractMeta = (content) => {
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  const descriptionMatch = content.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  return {
    title: titleMatch ? titleMatch[1].trim() : "Brahmand",
    description: descriptionMatch ? descriptionMatch[1].trim() : "",
  };
};

const htmlFiles = walkHtmlFiles(SITE_DIR);

const pages = htmlFiles.map((absPath) => {
  const relativePath = path.relative(SITE_DIR, absPath);
  const urlPath =
    relativePath === "index.html"
      ? "/"
      : `/${relativePath.replace(/index\\.html$/, "").replace(/\\/g, "/")}`;
  const cleanUrl = urlPath.replace(/\\/g, "/");
  const content = fs.readFileSync(absPath, "utf8");
  const { title, description } = extractMeta(content);
  return {
    path: relativePath,
    url: cleanUrl.endsWith("/") ? cleanUrl : cleanUrl,
    title,
    description,
    verse: getVerse(relativePath),
    type: getType(relativePath),
  };
});

const sitemapItems = pages.filter((page) => !page.path.includes("404.html"));

const sitemapXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapItems.map(
    (page) =>
      `  <url><loc>${siteUrl}${page.url}</loc><changefreq>weekly</changefreq></url>`,
  ),
  "</urlset>",
].join("\n");

fs.writeFileSync(path.join(SITE_DIR, "sitemap.xml"), sitemapXml.trim());

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(SITE_DIR, "robots.txt"), robotsTxt);

const searchIndex = pages
  .filter((page) => !page.path.includes("404.html"))
  .map((page) => ({
    title: page.title,
    description: page.description,
    url: page.url,
    verse: page.verse,
    type: page.type,
  }));

const assetsDir = path.join(SITE_DIR, "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(assetsDir, "search-index.json"),
  JSON.stringify(searchIndex, null, 2),
);

console.log(
  `Generated sitemap entries: ${sitemapItems.length}, search documents: ${searchIndex.length}`,
);
