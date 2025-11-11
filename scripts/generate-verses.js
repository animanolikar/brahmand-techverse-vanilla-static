"use strict";

const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "site");
const indexContent = fs.readFileSync(path.join(SITE_DIR, "index.html"), "utf8");

const navBlock = indexContent.match(
  /<!-- SITE-NAV-START -->[\s\S]*?<!-- SITE-NAV-END -->/,
)[0];
const footerBlock = indexContent.match(/<footer>[\s\S]*?<\/footer>/)[0];
const consentStart = indexContent.indexOf('<div class="banner-consent"');
const consentEnd = indexContent.indexOf("</div>\n\n  <script");
const consentBlock =
  consentStart >= 0 && consentEnd > consentStart
    ? indexContent.slice(consentStart, consentEnd + "</div>".length)
    : "";

const headCommon = `  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css">`;

const scriptBlock = '  <script src="/assets/js/main.js" defer></script>';

const buildPage = (title, description, body, extraHead = "", extraFoot = "") =>
  [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    `  <title>${title}</title>`,
    `  <meta name="description" content="${description}">`,
    headCommon,
    extraHead,
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
    scriptBlock,
    extraFoot,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");

const articleTemplate = ({ verse, tag, title, intro, sections, related }) => {
  const sectionMarkup = sections
    .map(
      (section) => `
        <h2>${section.heading}</h2>
        <ul class="list">
          ${section.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>`,
    )
    .join("\n");

  const relatedMarkup = related
    .map((entry) => `<a href="${entry.href}">${entry.label}</a>`)
    .join("");

  return `    <section class="article-grid">
      <article class="glass-panel article-content">
        <div class="article-meta">
          <span class="badge">${tag}</span>
          <span>${verse}</span>
        </div>
        <h1>${title}</h1>
        <p class="tagline">${intro}</p>
${sectionMarkup}
        <div class="related-links">
          <strong>You might also like:</strong>
          ${relatedMarkup}
        </div>
      </article>
      <aside class="sidebar-sticky">
        <div data-sticky-ad></div>
        <div class="glass-panel" style="margin-top:1.25rem;">
          <h3>${verse} download</h3>
          <p>Grab the ${verse} template pack with trackers and playbooks.</p>
          <a class="btn-primary" href="/about.html">Download pack</a>
        </div>
      </aside>
    </section>`;
};

const verses = [
  {
    slug: "finverse",
    name: "Finverse",
    description: "Finance OS for creators, freelancers, and modern households.",
    intro:
      "Build wealth stacks that balance recurring income, safety nets, and investing optionality.",
    articles: [
      {
        file: "beginners-budgeting.html",
        title: "Beginner Budgeting Map for First-Time Earners",
        description:
          "A human budgeting guide that connects values, envelopes, and automation.",
        tag: "Primer",
        intro:
          "Go beyond spreadsheets. This map ties intent, cash, and automation so your budget sticks.",
        sections: [
          {
            heading: "Audit your inputs",
            points: [
              "List every inflow and categorize it as fixed, variable, or seasonal.",
              "Map non-negotiables: rent, EMIs, insurance, subscriptions.",
              "Highlight values-driven goals—travel, learning, giving.",
            ],
          },
          {
            heading: "Automate envelopes",
            points: [
              "Use two accounts: income hub and spending hub.",
              "Schedule auto transfers for needs, wants, investments, and fun.",
              "Track leftovers weekly and redeploy toward debt or savings.",
            ],
          },
          {
            heading: "Iterate every sprint",
            points: [
              "Do a 15-min Friday retro: what felt off, what worked.",
              "Increase savings rate by 1% whenever income grows.",
              "Log insights inside your Finverse Notion board.",
            ],
          },
        ],
        related: [
          { href: "/finverse/sip-vs-rd-vs-fd.html", label: "SIP vs RD vs FD" },
          { href: "/finverse/cash-flow-ladder.html", label: "Cash-flow Ladder" },
          { href: "/skillverse/freelancer-pricing.html", label: "Pricing Guide" },
        ],
      },
      {
        file: "sip-vs-rd-vs-fd.html",
        title: "SIP vs RD vs FD: Which System Wins in 2025?",
        description:
          "Compare Systematic Investment Plans, Recurring Deposits, and Fixed Deposits across goals.",
        tag: "Comparison",
        intro:
          "India’s favorite savings vehicles behave very differently. Here’s how to pick the right mix.",
        sections: [
          {
            heading: "Liquidity & risk",
            points: [
              "SIPs ride market volatility but beat inflation long-term.",
              "RDs offer guaranteed returns but limited upside.",
              "FDs deliver certainty yet penalize early exits.",
            ],
          },
          {
            heading: "Cash-flow fit",
            points: [
              "Choose SIPs for long-term goals (5+ years).",
              "Use RDs for medium-term goals like travel or gadgets.",
              "Pick FDs when you need short-term parking with low risk.",
            ],
          },
          {
            heading: "Decision grid",
            points: [
              "Diversify: 60% SIP, 25% RD, 15% FD for balanced builders.",
              "Review interest rates quarterly.",
              "Align payouts with big annual expenses.",
            ],
          },
        ],
        related: [
          { href: "/finverse/beginners-budgeting.html", label: "Beginner Budgeting" },
          { href: "/finverse/cash-flow-ladder.html", label: "Cash-flow Ladder" },
          { href: "/techverse/notion-templates.html", label: "Finance Templates" },
        ],
      },
      {
        file: "cash-flow-ladder.html",
        title: "Cash-flow Ladder: Build Buffers in 3 Levels",
        description:
          "Stack essentials, growth, and freedom tiers so money arrives before bills land.",
        tag: "Framework",
        intro:
          "Stop living invoice to invoice. The ladder ensures expenses meet matching inflows ahead of time.",
        sections: [
          {
            heading: "Level 1 · Essentials",
            points: [
              "Cover rent, food, utilities with salary/retainers.",
              "Auto-sweep 1.5× monthly spend into high-yield savings.",
            ],
          },
          {
            heading: "Level 2 · Growth",
            points: [
              "Fund upskilling, marketing, and experiments with side-hustle income.",
              "Cap reinvestment at 30% until buffers hit 6 months.",
            ],
          },
          {
            heading: "Level 3 · Freedom",
            points: [
              "Channel surplus into SIPs or Index ETFs on autopilot.",
              "Every quarter, skim 5% for guilt-free spending.",
            ],
          },
        ],
        related: [
          { href: "/finverse/side-hustle-sprint.html", label: "Side Hustle Sprint" },
          { href: "/skillverse/microlearning-systems.html", label: "Microlearning Stack" },
          { href: "/healthverse/desk-detox.html", label: "Desk Detox" },
        ],
      },
      {
        file: "side-hustle-sprint.html",
        title: "Side-Hustle Sprint Planner",
        description:
          "A 4-week sprint to validate, monetize, and scale a side income stream.",
        tag: "Sprint",
        intro:
          "One month, one offer, one buyer persona. Use this sprint to de-risk your next income stream.",
        sections: [
          {
            heading: "Week 1 · Research",
            points: [
              "Interview 5 potential buyers and extract language.",
              "List deliverables you can ship in under 7 days.",
            ],
          },
          {
            heading: "Week 2 · Offer",
            points: [
              "Craft a simple landing page or Notion doc.",
              "Set a founder-friendly beta price.",
            ],
          },
          {
            heading: "Week 3-4 · Delivery",
            points: [
              "Deliver with white-glove intensity.",
              "Document testimonials + process video.",
              "Decide to scale, pause, or productize.",
            ],
          },
        ],
        related: [
          { href: "/skillverse/mentor-os.html", label: "Mentor OS" },
          { href: "/skillverse/freelancer-pricing.html", label: "Pricing Ladder" },
          { href: "/finverse/cash-flow-ladder.html", label: "Cash-flow Ladder" },
        ],
      },
    ],
  },
  {
    slug: "healthverse",
    name: "Healthverse",
    description: "Resilience stacks to keep makers energized while shipping.",
    intro:
      "Protocols designed for desk athletes: sleep, recovery, movement, and nutrition.",
    articles: [
      {
        file: "7-day-sleep-reset.html",
        title: "7-Day Sleep Reset Protocol",
        description:
          "A one-week protocol to recalibrate circadian rhythm and deep sleep.",
        tag: "Protocol",
        intro:
          "Use this reset anytime launches wreck your sleep. Small levers, big recovery.",
        sections: [
          {
            heading: "Days 1-2 · Environment",
            points: [
              "Blackout curtains + cold room (18-20°C).",
              "Sunlight within 30 minutes of waking.",
              "Cut caffeine after 2 p.m.",
            ],
          },
          {
            heading: "Days 3-4 · Rhythm",
            points: [
              "Fixed wake time, even on weekends.",
              "10-minute evening mobility to signal wind-down.",
              "Magnesium glycinate + chamomile ritual.",
            ],
          },
          {
            heading: "Days 5-7 · Deep work guardrails",
            points: [
              "No screens 45 minutes before bed.",
              "Write tomorrow’s priorities on paper.",
              "Use red-light or Kindle for night reading.",
            ],
          },
        ],
        related: [
          { href: "/healthverse/metabolic-mornings.html", label: "Metabolic Mornings" },
          { href: "/techverse/ai-tools.html", label: "AI Tool Stack" },
          { href: "/skillverse/one-page-resume.html", label: "One-page Resume" },
        ],
      },
      {
        file: "metabolic-mornings.html",
        title: "Metabolic Morning Playbook",
        description:
          "Stack light, movement, and macros to stabilize energy before noon.",
        tag: "Playbook",
        intro:
          "These micro-habits prevent afternoon crashes and keep dopamine steady.",
        sections: [
          {
            heading: "Light & hydration",
            points: [
              "Sun + 500 ml mineral water within 10 minutes.",
              "Add pinch of salt + lemon to jumpstart electrolytes.",
            ],
          },
          {
            heading: "Movement primer",
            points: [
              "5-minute jump rope or walk.",
              "90-second cold face splash for alertness.",
            ],
          },
          {
            heading: "Macros",
            points: [
              "Protein-forward breakfast (25g+).",
              "Fiber from berries or chia pudding.",
              "Delay heavy carbs until first work block ships.",
            ],
          },
        ],
        related: [
          { href: "/healthverse/desk-detox.html", label: "Desk Detox" },
          { href: "/healthverse/longevity-sprint.html", label: "Longevity Sprint" },
          { href: "/finverse/cash-flow-ladder.html", label: "Cash-flow Ladder" },
        ],
      },
      {
        file: "desk-detox.html",
        title: "Desk Detox Routine for Builders",
        description:
          "Counteract laptop posture with micro-movements and breath work.",
        tag: "Routine",
        intro:
          "A 15-minute flow resets posture, eyes, and nervous system between sprints.",
        sections: [
          {
            heading: "Mobility circuit",
            points: [
              "Thoracic rotations ×10/side.",
              "Reverse snow angels ×15.",
              "Couch stretch ×60 sec each leg.",
            ],
          },
          {
            heading: "Vision hygiene",
            points: [
              "20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.",
              "Palming + slow blinks to re-lubricate eyes.",
            ],
          },
          {
            heading: "Breath reset",
            points: [
              "Box breathing (4-4-4-4) for 2 minutes.",
              "Finish with 5 physiologic sighs.",
            ],
          },
        ],
        related: [
          { href: "/healthverse/metabolic-mornings.html", label: "Metabolic Mornings" },
          { href: "/skillverse/microlearning-systems.html", label: "Microlearning Systems" },
          { href: "/techverse/chrome-extensions.html", label: "Chrome Extensions" },
        ],
      },
      {
        file: "longevity-sprint.html",
        title: "Longevity Sprint 2×2×2",
        description:
          "A minimalist conditioning plan: 2 strength, 2 cardio, 2 mobility sessions per week.",
        tag: "Sprint",
        intro:
          "Keep founders durable with two high, two medium, two low days anchored to energy levels.",
        sections: [
          {
            heading: "Strength (2×)",
            points: [
              "Compound lifts (squat, hinge, push, pull) 3 sets × 6-8 reps.",
              "Tempo control on eccentrics.",
            ],
          },
          {
            heading: "Cardio (2×)",
            points: [
              "Zone 2 bike or jog for 30 minutes.",
              "One HIIT finisher (8 × 20s sprint).",
            ],
          },
          {
            heading: "Mobility (2×)",
            points: [
              "CARs (controlled articular rotations) for joints.",
              "10-minute yin yoga before bed.",
            ],
          },
        ],
        related: [
          { href: "/healthverse/desk-detox.html", label: "Desk Detox" },
          { href: "/skillverse/mentor-os.html", label: "Mentor OS" },
          { href: "/techverse/notion-templates.html", label: "Notion Vault" },
        ],
      },
    ],
  },
  {
    slug: "skillverse",
    name: "Skillverse",
    description: "Career playbooks for modern polymaths.",
    intro:
      "Land gigs, ship portfolios, and compound credibility without burning out.",
    articles: [
      {
        file: "one-page-resume.html",
        title: "One-Page Resume That Lands Operator Roles",
        description:
          "Structure, content, and proof points for a recruiter-friendly single pager.",
        tag: "Guide",
        intro:
          "The best resumes read like product tear-downs. Borrow this skeleton to stand out.",
        sections: [
          {
            heading: "Hero section",
            points: [
              "Headline with role + outcome (\"Growth PM · $15M ARR\").",
              "Link to portfolio/LinkedIn with short vanity URL.",
              "Add 3 skill chips relevant to JD.",
            ],
          },
          {
            heading: "Impact timeline",
            points: [
              "Use CAR format (challenge, action, result).",
              "Quantify everything: %, revenue, users.",
              "Keep bullet length under 2 lines.",
            ],
          },
          {
            heading: "Proof stack",
            points: [
              "Certifications or flagship talks.",
              "Testimonials snippet from founders/managers.",
              "Link to case studies for deeper dive.",
            ],
          },
        ],
        related: [
          { href: "/skillverse/freelancer-pricing.html", label: "Pricing Ladder" },
          { href: "/skillverse/mentor-os.html", label: "Mentor OS" },
          { href: "/techverse/notion-templates.html", label: "Notion Vault" },
        ],
      },
      {
        file: "freelancer-pricing.html",
        title: "Freelancer Pricing Ladder 2025",
        description:
          "Move from hourly to value-based retainers with this 4-rung ladder.",
        tag: "Pricing",
        intro:
          "Charge for outcomes, not time. Each rung introduces leverage without scaring clients.",
        sections: [
          {
            heading: "Rung 1 · Hourly",
            points: [
              "Use to validate demand quickly.",
              "Track every task to learn true effort.",
            ],
          },
          {
            heading: "Rung 2 · Project",
            points: [
              "Define scope, rounds, and success metrics upfront.",
              "Include kill fees for major pivots.",
            ],
          },
          {
            heading: "Rung 3 · Retainer & Rung 4 · Revenue share",
            points: [
              "Retainers lock in priority access.",
              "Rev-share kicks in once trust + track record exist.",
              "Always anchor pricing to business impact.",
            ],
          },
        ],
        related: [
          { href: "/finverse/side-hustle-sprint.html", label: "Side Hustle Sprint" },
          { href: "/skillverse/microlearning-systems.html", label: "Microlearning Systems" },
          { href: "/skillverse/mentor-os.html", label: "Mentor OS" },
        ],
      },
      {
        file: "microlearning-systems.html",
        title: "Microlearning Systems for Busy Builders",
        description:
          "Design a 20-minute daily learning stack with review cadences.",
        tag: "System",
        intro:
          "Compound skills without sacrificing shipping time. Small loops, tight retention.",
        sections: [
          {
            heading: "Capture",
            points: [
              "Bookmark high-signal threads/articles into a Notion inbox.",
              "Label by skill, difficulty, and energy required.",
            ],
          },
          {
            heading: "Sprints",
            points: [
              "Daily: 10 minutes of reading/watching + 10 minutes of application.",
              "Use spaced repetition for key formulas/scripts.",
            ],
          },
          {
            heading: "Share",
            points: [
              "Publish a weekly \"What I learned\" note.",
              "Teach inside your community or team lunch & learn.",
            ],
          },
        ],
        related: [
          { href: "/techverse/ai-tools.html", label: "AI Tool Stack" },
          { href: "/skillverse/mentor-os.html", label: "Mentor OS" },
          { href: "/healthverse/metabolic-mornings.html", label: "Metabolic Mornings" },
        ],
      },
      {
        file: "mentor-os.html",
        title: "Mentor OS: Turn Coffee Chats into Compounding Guidance",
        description:
          "Structure outreach, questions, and follow-ups so mentors want to keep helping.",
        tag: "Playbook",
        intro:
          "Mentorship runs on clarity. This OS keeps every interaction high-signal and low-friction.",
        sections: [
          {
            heading: "Pipeline",
            points: [
              "Track mentors by expertise, relationship depth, and reciprocity.",
              "Batch outreach once per quarter with personalized asks.",
            ],
          },
          {
            heading: "Call flow",
            points: [
              "Share a 3-line agenda 24 hours prior.",
              "Spend 70% on context, 30% on asks.",
              "Document action items live.",
            ],
          },
          {
            heading: "Compounding",
            points: [
              "Send momentum updates monthly.",
              "Offer value—intros, research, feedback.",
              "Graduated mentors become advisors or investors.",
            ],
          },
        ],
        related: [
          { href: "/skillverse/one-page-resume.html", label: "One-page Resume" },
          { href: "/finverse/side-hustle-sprint.html", label: "Side Hustle Sprint" },
          { href: "/techverse/notion-templates.html", label: "Notion Vault" },
        ],
      },
    ],
  },
];

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

verses.forEach((verse) => {
  const verseDir = path.join(SITE_DIR, verse.slug);
  ensureDir(verseDir);

  verse.articles.forEach((article) => {
    const body = articleTemplate({
      verse: verse.name,
      tag: article.tag,
      title: article.title,
      intro: article.intro,
      sections: article.sections,
      related: article.related,
    });
    const html = buildPage(article.title, article.description, body);
    fs.writeFileSync(path.join(verseDir, article.file), html);
  });

  const cards = verse.articles
    .map(
      (article) => `
        <article class="card">
          <h3>${article.title}</h3>
          <p>${article.description}</p>
          <a href="/${verse.slug}/${article.file}">Read more →</a>
        </article>`,
    )
    .join("\n");

  const hubBody = `    <section class="section">
      <div class="section-title">${verse.name} Hub</div>
      <p>${verse.intro}</p>
      <div class="grid" style="margin-top:1.5rem;">
${cards}
      </div>
    </section>`;

  const hubHtml = buildPage(
    `${verse.name} – Brahmand.co`,
    verse.description,
    hubBody,
  );
  fs.writeFileSync(path.join(verseDir, "index.html"), hubHtml);
});

console.log("Generated verse hubs and articles for Finverse, Healthverse, Skillverse.");
