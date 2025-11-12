"use strict";

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const SITE_DIR = path.join(__dirname, "..", "site");
const SEARCH_INDEX = path.join(SITE_DIR, "assets", "search-index.json");
const OG_DIR = path.join(SITE_DIR, "assets", "og");
const siteUrl = (process.env.SITE_URL || "https://brahmand.co").replace(/\/$/, "");

if (!fs.existsSync(SEARCH_INDEX)) {
  console.error("Missing search index. Run `npm run build:meta` first.");
  process.exit(1);
}

if (!fs.existsSync(OG_DIR)) {
  fs.mkdirSync(OG_DIR, { recursive: true });
}

const palette = {
  Techverse: ["#120625", "#481f9c"],
  Finverse: ["#041b1b", "#0b6f7d"],
  Healthverse: ["#051a2a", "#117e5d"],
  Skillverse: ["#1a0a2f", "#9b2785"],
  Tools: ["#071126", "#15467a"],
  Core: ["#070a1f", "#3f2079"],
};

const slugify = (url) => {
  if (url === "/") return "home";
  const cleaned = url.replace(/^\//, "").replace(/\/$/, "").replace(/\.[^.]+$/, "");
  const slug = cleaned
    .split("/")
    .filter(Boolean)
    .join("-")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "page";
};

const htmlPathFromUrl = (url) => {
  if (url === "/") return path.join(SITE_DIR, "index.html");
  const cleaned = url.replace(/^\//, "");
  if (!cleaned || cleaned.endsWith("/")) {
    return path.join(SITE_DIR, cleaned, "index.html");
  }
  return path.join(SITE_DIR, cleaned);
};

const escapeAttr = (value) => value.replace(/"/g, "&quot;");

const ensureOgMeta = (filePath, meta) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");
  if (/property=["']og:image["']/.test(content)) return;

  const block = [
    `  <meta property="og:title" content="${escapeAttr(meta.title)}">`,
    `  <meta property="og:description" content="${escapeAttr(meta.description)}">`,
    `  <meta property="og:type" content="article">`,
    `  <meta property="og:url" content="${siteUrl}${meta.url}">`,
    `  <meta property="og:image" content="${siteUrl}${meta.ogPath}">`,
  ].join("\n");

  const descMatch = content.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  if (descMatch) {
    content = content.replace(descMatch[0], `${descMatch[0]}\n${block}`);
  } else {
    content = content.replace("</head>", `${block}\n</head>`);
  }

  fs.writeFileSync(filePath, content);
};

const buildTemplate = (entry) => {
  const [startColor, endColor] = palette[entry.verse] || palette.Core;
  const subtitle =
    entry.verse === "Core"
      ? "Brahmand.co"
      : `${entry.verse} · ${entry.type.replace(/^[a-z]/, (c) => c.toUpperCase())}`;
  const safeTitle = entry.title.length > 80 ? `${entry.title.slice(0, 77)}…` : entry.title;
  const safeDesc =
    entry.description.length > 140
      ? `${entry.description.slice(0, 137)}…`
      : entry.description;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;600&display=swap");
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 630px;
        font-family: "Space Grotesk", "Inter", system-ui, -apple-system, sans-serif;
        background: radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent 55%),
          linear-gradient(135deg, ${startColor}, ${endColor});
        color: #fafdff;
        padding: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .badge {
        display: inline-flex;
        padding: 8px 18px;
        border-radius: 999px;
        background: rgba(255,255,255,0.15);
        font-size: 24px;
      }
      h1 {
        font-size: 72px;
        line-height: 1.1;
        margin-top: 30px;
        margin-bottom: 30px;
        max-width: 1000px;
      }
      p {
        font-size: 30px;
        max-width: 950px;
        color: rgba(255,255,255,0.85);
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 28px;
        color: rgba(255,255,255,0.8);
      }
      .logo {
        font-weight: 700;
        letter-spacing: 0.2em;
      }
    </style>
  </head>
  <body>
    <div>
      <span class="badge">${subtitle}</span>
      <h1>${safeTitle}</h1>
      <p>${safeDesc}</p>
    </div>
    <div class="footer">
      <span class="logo">BRAHMAND</span>
      <span>${siteUrl.replace(/^https?:\/\//, "")}${entry.url}</span>
    </div>
  </body>
</html>`;
};

const entries = JSON.parse(fs.readFileSync(SEARCH_INDEX, "utf8"));

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();

  for (const entry of entries) {
    const slug = slugify(entry.url);
    const filename = `${slug}.png`;
    const outputPath = path.join(OG_DIR, filename);
    const template = buildTemplate(entry);
    await page.setContent(template, { waitUntil: "domcontentloaded", timeout: 0 });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await page.screenshot({ path: outputPath });

    ensureOgMeta(htmlPathFromUrl(entry.url), {
      title: entry.title,
      description: entry.description,
      url: entry.url,
      ogPath: `/assets/og/${filename}`,
    });

    console.log(`OG image created: ${filename}`);
  }

  await browser.close();
  console.log(`Generated ${entries.length} OG images in ${OG_DIR}`);
})();
