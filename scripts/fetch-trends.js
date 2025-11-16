"use strict";

if (typeof globalThis.File === "undefined") {
  const { Blob } = require("buffer");
  globalThis.File = class File extends Blob {
    constructor(chunks, filename, options = {}) {
      super(chunks, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  };
}

require("../src/shims/patch-debug");

const cheerio = require("cheerio");
const dayjs = require("dayjs");
const https = require("https");
const { pool } = require("../src/config/db");

const RSS_URLS = [
  "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN&hl=en-US",
  "https://trends.google.com/trending/rss?geo=IN&hl=en-US",
];

async function fetchTrendsFeed() {
  let lastError = null;
  for (const url of RSS_URLS) {
    try {
      const xml = await fetchWithHttps(url);
      return parseTrends(xml);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unknown error hitting Google Trends RSS");
}

function parseTrends(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $("item").each((_, element) => {
    const el = $(element);
    const title = el.find("title").text().trim();
    const link = el.find("ht\\:news_item_url").first().text().trim() || el.find("link").text().trim();
    const source = el.find("ht\\:news_item_source").first().text().trim() || "Google Trends";

    const snippet =
      el.find("ht\\:news_item_snippet")
        .first()
        .text()
        .trim() || el.find("description").text().trim();
    const traffic = el.find("ht\\:approx_traffic").text().trim();
    const descriptionParts = [];
    if (traffic) descriptionParts.push(`🔥 Approximately ${traffic} searches today.`);
    if (snippet) descriptionParts.push(snippet);
    const description =
      descriptionParts.join(" ") ||
      `${title} is spiking right now across India according to Google Trends.`;

    if (title) {
      items.push({
        title,
        link: link || null,
        source,
        description,
      });
    }
  });

  return items.slice(0, 50);
}

function fetchWithHttps(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: "https://trends.google.com/trending?geo=IN&hl=en-US",
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          fetchWithHttps(response.headers.location).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          response.resume();
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );

    request.on("error", reject);
  });
}

async function saveTrends(trends) {
  if (!trends.length) {
    return 0;
  }

  let inserted = 0;
  for (const trend of trends) {
    try {
      let metaTitle = null;
      let metaDescription = null;
      if (trend.link) {
        const meta = await fetchPageMetadata(trend.link);
        metaTitle = meta.title;
        metaDescription = meta.description;
      }

      await pool.query(
        `INSERT INTO trends (title, link, source, description, meta_title, meta_description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           link = VALUES(link),
           source = VALUES(source),
           description = VALUES(description),
           meta_title = VALUES(meta_title),
           meta_description = VALUES(meta_description)`,
        [
          trend.title,
          trend.link,
          trend.source,
          trend.description,
          metaTitle,
          metaDescription,
          dayjs().toDate(),
        ],
      );
      inserted += 1;
    } catch (error) {
      console.error(`Failed to save trend "${trend.title}":`, error.message);
    }
  }

  return inserted;
}

async function fetchPageMetadata(url) {
  try {
    const html = await fetchWithHttps(url);
    const $ = cheerio.load(html);
    const title =
      $("meta[property='og:title']").attr("content") ||
      $("title").first().text() ||
      null;
    const description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      $("p").first().text() ||
      null;

    return {
      title: title ? title.trim().slice(0, 255) : null,
      description: description ? description.trim().slice(0, 1000) : null,
    };
  } catch {
    return { title: null, description: null };
  }
}

async function main() {
  try {
    const trends = await fetchTrendsFeed();
    const inserted = await saveTrends(trends);
    console.log(`Fetched ${trends.length} trends. Inserted/updated ${inserted}.`);
  } catch (error) {
    console.error("Trend fetch failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
