"use strict";

require("../src/shims/patch-debug");

const dayjs = require("dayjs");
const { pool } = require("../src/config/db");
const { createArticle } = require("../src/services/articleService");

const AUTHOR_ID = Number(process.env.TREND_AUTHOR_ID || 1);

async function fetchTopTrends(limit = 50) {
  const [rows] = await pool.query(
    `SELECT title, link, description, source
     FROM trends
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows;
}

function buildMarkdown(trend) {
  const lines = [
    `# ${trend.title}`,
    "",
    trend.description || "This topic is trending across India today.",
  ];

  if (trend.link) {
    lines.push("", `[Read more here](${trend.link})`);
  }

  lines.push(
    "",
    "## Why it matters",
    "",
    "- Aligns with ongoing conversations surfaced on Google Trends.",
    "- Opportunity to ship related tools, explainers, or monetization hooks.",
    "",
    "## Next actions",
    "",
    "- Brief the editorial team on this spike.",
    "- Update relevant verses or tools with fresh context.",
  );

  return lines.join("\n");
}

async function main() {
  try {
    const trends = await fetchTopTrends(50);
    let created = 0;
    for (const trend of trends) {
      const payload = {
        title: trend.title,
        slug: trend.title,
        verse: "techverse",
        status: "published",
        schema_type: "none",
        meta_title: trend.meta_title || `${trend.title} • Brahmand`,
        meta_desc:
          trend.meta_description ||
          trend.description?.slice(0, 320) ||
          `${trend.title} is trending across India today.`,
        publish_at: new Date().toISOString(),
        markdown: buildMarkdown(trend),
      };

      try {
        await createArticle(payload, AUTHOR_ID);
        created += 1;
      } catch (error) {
        console.error(`Skipping "${trend.title}": ${error.message}`);
      }
    }

    console.log(`Generated ${created} articles from ${trends.length} trends.`);
  } catch (error) {
    console.error("Trend article generation failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

