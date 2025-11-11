"use strict";

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const SITE_DIR = path.join(__dirname, "..", "site");
const CALENDAR_PATH = path.join(SITE_DIR, "content", "content-calendar.csv");
const indexContent = fs.readFileSync(path.join(SITE_DIR, "index.html"), "utf8");

const navBlock = indexContent.match(
  /<!-- SITE-NAV-START -->[\s\S]*?<!-- SITE-NAV-END -->/,
)[0];
const footerBlock = indexContent.match(/<footer>[\s\S]*?<\/footer>/)[0];
const consentMatch = indexContent.match(
  /(<div class="banner-consent"[\s\S]*?<\/div>)\s*\n\s*<script/,
);
const consentBlock = consentMatch ? consentMatch[1] : "";

const headCommon = `  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">`;

const scriptBlock = '  <script src="/assets/js/main.js" defer></script>';

const csvContent = fs.readFileSync(CALENDAR_PATH, "utf8");
const rows = parse(csvContent, { columns: true, skip_empty_lines: true });

const firstTen = rows.slice(0, 10);

const sentence = (text) => text.endsWith(".") ? text : `${text}.`;

const buildSections = (row) => {
  const base = row.Title;
  const lowerType = row.Type.toLowerCase();
  const shared = [
    {
      heading: "Clarify intent",
      points: [
        `Write down why ${base} matters this quarter.`,
        "Define a success metric and owner.",
      ],
    },
    {
      heading: "Build the system",
      points: [
        "Document steps inside Notion or your ops tool.",
        "Automate handoffs with AI or Zapier where possible.",
      ],
    },
    {
      heading: "Review and iterate",
      points: [
        "Run weekly retros on what blocked momentum.",
        "Share highlights with your community or team leads.",
      ],
    },
  ];

  switch (lowerType) {
    case "howto":
      return [
        {
          heading: "Plan the move",
          points: [
            `List the exact inputs required to run ${base}.`,
            "Save links, prompts, and stakeholders in one doc.",
          ],
        },
        {
          heading: "Run the play",
          points: [
            "Work in timed sprints to keep momentum.",
            "Log blockers immediately so they can be cleared.",
          ],
        },
        {
          heading: "Ship + learn",
          points: [
            "Publish the outcome, even if imperfect.",
            "Convert notes into a repeatable SOP.",
          ],
        },
      ];
    case "checklist":
      return [
        {
          heading: "Pre-flight",
          points: [
            `Confirm stakeholders and deadlines for ${base}.`,
            "Gather templates, tools, and data sources.",
          ],
        },
        {
          heading: "Execution",
          points: [
            "Tick off each task in your project tracker.",
            "Attach evidence (screenshots, links) for each item.",
          ],
        },
        {
          heading: "QA + launch",
          points: [
            "Have a partner review the checklist.",
            "Archive in Notion for future versions.",
          ],
        },
      ];
    case "playbook":
      return [
        {
          heading: "Inputs",
          points: [
            "Document triggers, tools, and roles.",
            "Define minimum viable resources.",
          ],
        },
        {
          heading: "Actions",
          points: [
            "Outline daily/weekly cadences.",
            "Include prompt packs or scripts.",
          ],
        },
        {
          heading: "Reviews",
          points: [
            "Schedule retros with metrics snapshots.",
            "Capture learnings for v2.",
          ],
        },
      ];
    case "guide":
    case "system":
    case "template":
    case "best of":
    case "routine":
    case "glossary":
    case "tool":
      return shared;
    default:
      return shared;
  }
};

const buildSchema = (schema, row, sections) => {
  if (!schema || schema.toLowerCase() === "article") return "";
  if (schema.toLowerCase() === "howto") {
    const steps = sections.map((section) => ({
      "@type": "HowToStep",
      name: section.heading,
      text: sentence(section.points[0]),
    }));
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: row.Title,
      description: row["Meta_Desc"],
      step: steps,
    };
  }
  if (schema.toLowerCase() === "faq") {
    const questions = sections.map((section) => ({
      "@type": "Question",
      name: `${section.heading} – ${row.Title}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: sentence(section.points.join(" ")),
      },
    }));
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: questions,
    };
  }
  return "";
};

const pickRelated = (currentIndex, row) => {
  const sameVerse = rows.filter(
    (entry, idx) => entry.Verse === row.Verse && idx !== currentIndex,
  );
  const pool = sameVerse.length >= 3 ? sameVerse : rows;
  return pool.slice(0, 4).map((item) => ({
    url: item.URL,
    title: item.Title,
  }));
};

const buildPage = (row, sections, schemaData, related) => {
  const sectionHtml = sections
    .map(
      (section) => `
        <h2>${section.heading}</h2>
        <ul class="list">
          ${section.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>`,
    )
    .join("\n");

  const relatedHtml = related
    .map((item) => `<a href="${item.url}">${item.title}</a>`)
    .join("");

  const schemaBlock = schemaData
    ? `
  <script type="application/ld+json">
${JSON.stringify(schemaData, null, 2)}
  </script>`
    : "";

  const body = `    <section class="article-grid">
      <article class="glass-panel article-content">
        <div class="article-meta">
          <span class="badge">${row.Type}</span>
          <span>${row.Verse}</span>
        </div>
        <h1>${row.Title}</h1>
        <p class="tagline">${row["Meta_Desc"]}</p>
${sectionHtml}
        <div class="related-links">
          <strong>You might also like:</strong>
          ${relatedHtml}
        </div>
      </article>
      <aside class="sidebar-sticky">
        <div data-sticky-ad></div>
        <div class="glass-panel" style="margin-top:1.25rem;">
          <h3>Interlink idea</h3>
          <p>${row["Interlink strategy"] || "Share this article inside your verse hub."}</p>
        </div>
      </aside>
    </section>`;

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    `  <title>${row["Meta_Title"]}</title>`,
    `  <meta name="description" content="${row["Meta_Desc"]}">`,
    headCommon,
    schemaBlock,
    "</head>",
    "<body>",
    navBlock,
    "  <main>",
    body,
    "  </main>",
    footerBlock,
    "",
    consentBlock,
    "",
    `${scriptBlock}`,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
};

firstTen.forEach((row, idx) => {
  const sections = buildSections(row);
  const schemaData = buildSchema(row.Schema, row, sections);
  const related = pickRelated(idx, row);
  const pageContent = buildPage(row, sections, schemaData, related);
  const relativePath = row.URL.replace(/^\//, "");
  const outputPath = path.join(SITE_DIR, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, pageContent);
  console.log(`Generated article: ${row.URL}`);
});
