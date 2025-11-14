"use strict";

const versePools = {
  techverse: [
    { title: "AI tool stack 2025", url: "/techverse/ai-tools.html" },
    { title: "Canva vs Figma", url: "/techverse/canva-vs-figma.html" },
    { title: "Notion template vault", url: "/techverse/notion-templates.html" },
    { title: "Chrome extensions kit", url: "/techverse/chrome-extensions.html" },
  ],
  finverse: [
    { title: "Beginner budgeting", url: "/finverse/beginners-budgeting.html" },
    { title: "Cash-flow ladder", url: "/finverse/cash-flow-ladder.html" },
    { title: "SIP vs RD vs FD", url: "/finverse/sip-vs-rd-vs-fd.html" },
  ],
  healthverse: [
    { title: "Metabolic mornings", url: "/healthverse/metabolic-mornings.html" },
    { title: "Desk detox routine", url: "/healthverse/desk-detox.html" },
  ],
  skillverse: [
    { title: "One-page resume", url: "/skillverse/one-page-resume.html" },
    { title: "Freelancer pricing ladder", url: "/skillverse/freelancer-pricing.html" },
  ],
};

const defaultPool = [
  { title: "Focus Timer", url: "/tools/focus-timer.html" },
  { title: "Text Cleaner", url: "/tools/text-cleaner.html" },
  { title: "Image Resizer", url: "/tools/image-resizer.html" },
];

function getSuggestedLinks(verseCode) {
  const versePool = versePools[verseCode] || [];
  const sameVerse = versePool.slice(0, 3);

  const crossVerse = Object.entries(versePools)
    .filter(([code]) => code !== verseCode)
    .flatMap(([, links]) => links)
    .slice(0, 1);

  const pool = [...sameVerse, ...crossVerse, ...defaultPool];

  return pool.slice(0, 5);
}

module.exports = {
  getSuggestedLinks,
};

