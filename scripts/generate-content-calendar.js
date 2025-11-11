"use strict";

const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");

const SITE_DIR = path.join(__dirname, "..", "site");
const OUTPUT_PATH = path.join(SITE_DIR, "content", "content-calendar.csv");

const postsByVerse = {
  Techverse: [
    { title: "AI Automation Checklist", type: "Checklist", slug: "ai-automation-checklist", schema: "HowTo", meta: "AI Automation Checklist for Tech Teams", desc: "Step-by-step automation checklist for Ops teams.", interlink: "Link to ai-tools + focus timer." },
    { title: "Prompt Ops Playbook", type: "Playbook", slug: "prompt-ops-playbook", schema: "FAQ", meta: "Prompt Ops Playbook", desc: "Governance for stored prompts and reviews.", interlink: "Link to ai-tools + notion templates." },
    { title: "Browser Workspace Setup", type: "Guide", slug: "browser-workspace-setup", schema: "Article", meta: "Browser Workspace Setup for Builders", desc: "Chrome profiles, extensions, and sync tips.", interlink: "Link to chrome-extensions + image resizer." },
    { title: "Research Sprint System", type: "System", slug: "research-sprint-system", schema: "Article", meta: "Research Sprint System", desc: "Structure 3-day research loops.", interlink: "Link to ai-tools + techverse hub." },
    { title: "Creator Studio Stack", type: "Best Of", slug: "creator-studio-stack", schema: "FAQ", meta: "Creator Studio Stack 2025", desc: "Hardware + software picks for creators.", interlink: "Link to image resizer + chrome extensions." },
    { title: "One-Day Landing Page", type: "HowTo", slug: "one-day-landing-page", schema: "HowTo", meta: "Launch a Landing Page in One Day", desc: "Template-driven landing workflow.", interlink: "Link to canva-vs-figma + notion templates." },
    { title: "Notion CRM Template", type: "Template", slug: "notion-crm-template", schema: "Article", meta: "Notion CRM Template for Solo Teams", desc: "Fields and automations for CRM board.", interlink: "Link to notion templates + focus timer." },
    { title: "AI QA Framework", type: "Guide", slug: "ai-qa-framework", schema: "FAQ", meta: "AI QA Framework", desc: "Testing loops for AI generated work.", interlink: "Link to ai-tools + chrome extensions." },
    { title: "Automation API Glossary", type: "Glossary", slug: "automation-api-glossary", schema: "Article", meta: "Automation API Glossary", desc: "Key APIs for makers with quick usage.", interlink: "Link to research sprint + ai tools." },
    { title: "Content Remix Machine", type: "HowTo", slug: "content-remix-machine", schema: "HowTo", meta: "Content Remix Machine", desc: "Repurpose long-form to shorts fast.", interlink: "Link to text cleaner + image resizer." },
    { title: "Docs-to-Site Workflow", type: "Guide", slug: "docs-to-site-workflow", schema: "Article", meta: "Docs to Site Workflow", desc: "Publish docs to static site pipeline.", interlink: "Link to techverse hub + ai automation." },
    { title: "Makers' Hardware Kit", type: "Best Of", slug: "makers-hardware-kit", schema: "FAQ", meta: "Hardware Kit for Makers 2025", desc: "Laptop, mic, lighting suggestions.", interlink: "Link to creator studio + skillverse resume." },
    { title: "Chrome Keyboard Almanac", type: "Guide", slug: "chrome-keyboard-almanac", schema: "Article", meta: "Chrome Keyboard Shortcuts Almanac", desc: "Shortcuts grouped by workflow.", interlink: "Link to chrome extensions + focus timer." },
    { title: "Idea Validation Canvas", type: "Template", slug: "idea-validation-canvas", schema: "Article", meta: "Idea Validation Canvas", desc: "One-pager for experiments.", interlink: "Link to side-hustle sprint + mentor OS." },
    { title: "Video Snippet Pipeline", type: "HowTo", slug: "video-snippet-pipeline", schema: "HowTo", meta: "Create Video Snippets Fast", desc: "FFmpeg + Descript workflow.", interlink: "Link to image resizer + content remix." },
  ],
  Finverse: [
    { title: "Emergency Fund Ladder", type: "HowTo", slug: "emergency-fund-ladder", schema: "HowTo", meta: "Build an Emergency Fund Ladder", desc: "Tiered buffers for 3/6/12 months.", interlink: "Link to beginners budgeting + cash-flow ladder." },
    { title: "Debt Avalanche Planner", type: "Guide", slug: "debt-avalanche-planner", schema: "FAQ", meta: "Debt Avalanche Planner", desc: "Prioritize repayments with automation.", interlink: "Link to budgeting + sip vs rd." },
    { title: "Family Money Meeting", type: "Checklist", slug: "family-money-meeting", schema: "HowTo", meta: "Family Money Meeting Agenda", desc: "45-min format for households.", interlink: "Link to budgeting + healthverse resets." },
    { title: "SaaS Expense Review", type: "Checklist", slug: "saas-expense-review", schema: "Article", meta: "SaaS Expense Review Checklist", desc: "Trim subscriptions quarterly.", interlink: "Link to cash-flow ladder + techverse automation." },
    { title: "Fire Calculator India", type: "Tool", slug: "fire-calculator-india", schema: "FAQ", meta: "FIRE Calculator for India", desc: "Targets for financial independence.", interlink: "Link to SIP vs RD vs FD + skillverse pricing." },
    { title: "Angel Investing Starter", type: "Guide", slug: "angel-investing-starter", schema: "FAQ", meta: "Angel Investing Starter Kit", desc: "Checklist for first syndicate deals.", interlink: "Link to side-hustle sprint + mentor OS." },
    { title: "Money OS in Notion", type: "Template", slug: "money-os-notion", schema: "Article", meta: "Money OS Notion Template", desc: "Databases for accounts, goals, loans.", interlink: "Link to notion templates + budgeting." },
    { title: "Solo Founder Taxes", type: "Guide", slug: "solo-founder-taxes", schema: "FAQ", meta: "Solo Founder Tax Checklist", desc: "Quarterly compliance reminders.", interlink: "Link to cash-flow ladder + skillverse resume." },
    { title: "Side Hustle Budget", type: "Checklist", slug: "side-hustle-budget", schema: "Article", meta: "Side Hustle Budget Template", desc: "Expenses vs reinvestment blueprint.", interlink: "Link to side-hustle sprint + pricing ladder." },
    { title: "Recurring Revenue Tracker", type: "Template", slug: "recurring-revenue-tracker", schema: "Article", meta: "Recurring Revenue Tracker", desc: "Track MRR + forecasts for creators.", interlink: "Link to skillverse mentor + cash-flow ladder." },
    { title: "Crypto Treasury Policy", type: "Guide", slug: "crypto-treasury-policy", schema: "FAQ", meta: "Crypto Treasury Policy", desc: "Principles for holding/staking stablecoins.", interlink: "Link to money os + research sprint." },
    { title: "RRR Investment System", type: "System", slug: "rrr-investment-system", schema: "Article", meta: "RRR Investment System", desc: "Blend risk, reward, recurring contributions.", interlink: "Link to SIP vs RD vs FD + emergency ladder." },
    { title: "Pros vs Cons of Credit Cards", type: "FAQ", slug: "credit-card-pros-cons", schema: "FAQ", meta: "Credit Card Pros and Cons", desc: "Pick cards for perks with guardrails.", interlink: "Link to family money meeting + budgeting." },
    { title: "Weekend Money Reset", type: "HowTo", slug: "weekend-money-reset", schema: "HowTo", meta: "Weekend Money Reset", desc: "2-hour ritual for pay cycles.", interlink: "Link to focus timer + budgeting map." },
    { title: "Financial Vision Board", type: "Guide", slug: "financial-vision-board", schema: "Article", meta: "Financial Vision Board", desc: "Translate lifestyle goals into numbers.", interlink: "Link to skillverse resume + healthverse resets." },
  ],
  Healthverse: [
    { title: "Deep Work Warmup", type: "Routine", slug: "deep-work-warmup", schema: "HowTo", meta: "Deep Work Warmup Routine", desc: "Movement stack before intense sprints.", interlink: "Link to desk detox + focus timer." },
    { title: "Anti-Anxiety Toolkit", type: "Guide", slug: "anti-anxiety-toolkit", schema: "FAQ", meta: "Anti-Anxiety Toolkit", desc: "Breath, journaling, supplement stack.", interlink: "Link to sleep reset + mentor OS." },
    { title: "Creator Meal Prep", type: "HowTo", slug: "creator-meal-prep", schema: "HowTo", meta: "Meal Prep for Creators", desc: "Batch cook in 90 minutes weekly.", interlink: "Link to metabolic mornings + budgeting." },
    { title: "Desk Mobility Flow", type: "Checklist", slug: "desk-mobility-flow", schema: "Article", meta: "Desk Mobility Flow", desc: "Hourly resets for posture + eyes.", interlink: "Link to desk detox + focus timer." },
    { title: "90-Min Sleep Sprint", type: "Protocol", slug: "90-min-sleep-sprint", schema: "HowTo", meta: "90-Minute Sleep Sprint", desc: "Emergency recovery after all-nighters.", interlink: "Link to sleep reset + metabolic mornings." },
    { title: "Hydration Habit Grid", type: "Guide", slug: "hydration-habit-grid", schema: "FAQ", meta: "Hydration Habit Grid", desc: "Electrolyte + reminder system.", interlink: "Link to metabolic mornings + deep work warmup." },
    { title: "Founder Fitness Stack", type: "Best Of", slug: "founder-fitness-stack", schema: "Article", meta: "Founder Fitness Stack", desc: "Apps + gear for staying active while shipping.", interlink: "Link to longevity sprint + skillverse mentor." },
    { title: "Blue Light Detox", type: "HowTo", slug: "blue-light-detox", schema: "HowTo", meta: "Blue Light Detox", desc: "Protocols to cut screen fatigue.", interlink: "Link to desk detox + techverse chrome tips." },
    { title: "Mindful Break Library", type: "Guide", slug: "mindful-break-library", schema: "FAQ", meta: "Mindful Break Library", desc: "Curated micro-meditations for busy founders.", interlink: "Link to focus timer + metabolic mornings." },
    { title: "Weekend Nature Reset", type: "HowTo", slug: "weekend-nature-reset", schema: "HowTo", meta: "Weekend Nature Reset", desc: "Plan mini-retreats for nervous system recovery.", interlink: "Link to longevity sprint + financial vision board." },
    { title: "Caffeine Taper Plan", type: "Guide", slug: "caffeine-taper-plan", schema: "FAQ", meta: "Caffeine Taper Plan", desc: "Reduce caffeine without withdrawal.", interlink: "Link to metabolic mornings + sleep reset." },
    { title: "Focus Breathing Protocols", type: "Guide", slug: "focus-breathing-protocols", schema: "HowTo", meta: "Focus Breathing Protocols", desc: "Breathwork that powers deep work.", interlink: "Link to deep work warmup + focus timer." },
    { title: "Laptop Ergonomics Kit", type: "Best Of", slug: "laptop-ergonomics-kit", schema: "Article", meta: "Laptop Ergonomics Kit", desc: "Gear list for remote teams.", interlink: "Link to desk detox + skillverse resume." },
    { title: "Sleep Data Decoder", type: "Guide", slug: "sleep-data-decoder", schema: "FAQ", meta: "Sleep Data Decoder", desc: "Interpret Oura/Whoop metrics properly.", interlink: "Link to sleep reset + metabolic mornings." },
    { title: "Digital Sunset Routine", type: "HowTo", slug: "digital-sunset-routine", schema: "HowTo", meta: "Digital Sunset Routine", desc: "Wind-down ritual for makers.", interlink: "Link to focus timer + weekend money reset." },
  ],
  Skillverse: [
    { title: "Portfolio Homepage Wireframe", type: "HowTo", slug: "portfolio-homepage-wireframe", schema: "HowTo", meta: "Portfolio Homepage Wireframe", desc: "Structure hero, proof, CTAs.", interlink: "Link to one-page resume + creator studio stack." },
    { title: "Interview Story Bank", type: "Guide", slug: "interview-story-bank", schema: "FAQ", meta: "Interview Story Bank System", desc: "Capture STAR/CAR stories quickly.", interlink: "Link to mentor OS + resume." },
    { title: "Weekly Career Retro", type: "Checklist", slug: "weekly-career-retro", schema: "Article", meta: "Weekly Career Retro", desc: "Reflect and set next experiments.", interlink: "Link to microlearning + mentor OS." },
    { title: "AI-Ready Resume Prompts", type: "Guide", slug: "ai-ready-resume-prompts", schema: "FAQ", meta: "AI Ready Resume Prompts", desc: "Prompt bank for tailoring resumes.", interlink: "Link to resume + prompt ops playbook." },
    { title: "LinkedIn Pulse Plan", type: "HowTo", slug: "linkedin-pulse-plan", schema: "HowTo", meta: "LinkedIn Pulse Plan", desc: "Ship weekly posts with repurposing.", interlink: "Link to content remix + mentor OS." },
    { title: "Community OS Template", type: "Template", slug: "community-os-template", schema: "Article", meta: "Community OS Template", desc: "Task + ritual template for communities.", interlink: "Link to mentor OS + microlearning." },
    { title: "Client Onboarding Ritual", type: "HowTo", slug: "client-onboarding-ritual", schema: "HowTo", meta: "Client Onboarding Ritual", desc: "Scripts and docs for new retainers.", interlink: "Link to pricing ladder + mentor OS." },
    { title: "Case Study Blueprint", type: "Guide", slug: "case-study-blueprint", schema: "FAQ", meta: "Case Study Blueprint", desc: "Structure wins into mini-landing pages.", interlink: "Link to resume + portfolio wireframe." },
    { title: "Public Build Tracker", type: "Template", slug: "public-build-tracker", schema: "Article", meta: "Public Build Tracker", desc: "Document progress for audiences.", interlink: "Link to linkedin pulse + content remix." },
    { title: "Offer Negotiation Scripts", type: "Guide", slug: "offer-negotiation-scripts", schema: "FAQ", meta: "Offer Negotiation Scripts", desc: "Messaging for comp + perks.", interlink: "Link to resume + mentor OS." },
    { title: "Creator Income Dashboard", type: "Template", slug: "creator-income-dashboard", schema: "Article", meta: "Creator Income Dashboard", desc: "Track brand deals, aff links, products.", interlink: "Link to cash-flow ladder + pricing ladder." },
    { title: "Skill Stacking Map", type: "Guide", slug: "skill-stacking-map", schema: "FAQ", meta: "Skill Stacking Map", desc: "Plan complementary skills to learn.", interlink: "Link to microlearning + mentor OS." },
    { title: "Mentor Outreach Scripts", type: "Guide", slug: "mentor-outreach-scripts", schema: "FAQ", meta: "Mentor Outreach Scripts", desc: "Cold DM/email templates that convert.", interlink: "Link to mentor OS + side-hustle sprint." },
    { title: "Micro-Workshop Framework", type: "HowTo", slug: "micro-workshop-framework", schema: "HowTo", meta: "Micro Workshop Framework", desc: "Deliver 45-min workshops live.", interlink: "Link to linkedin pulse + mentor OS." },
    { title: "Creator Collaboration Brief", type: "Template", slug: "creator-collaboration-brief", schema: "Article", meta: "Creator Collaboration Brief", desc: "Checklist for collabs and brand deals.", interlink: "Link to offer negotiation + pricing ladder." },
  ],
};

const startDate = dayjs("2025-03-01");
const rows = [];

Object.entries(postsByVerse).forEach(([verse, posts]) => {
  posts.forEach((post) => rows.push({ verse, ...post }));
});

const headers = [
  "Verse",
  "Title",
  "Type",
  "URL",
  "Publish_Date",
  "Schema",
  "Meta_Title",
  "Meta_Desc",
  "Interlink strategy",
];

const csvLines = [headers.join(",")];

rows.forEach((row, index) => {
  const publishDate = startDate.add(index, "day").format("YYYY-MM-DD");
  const url = `/${row.verse.toLowerCase()}/${row.slug}.html`;
  const line = [
    row.verse,
    `"${row.title}"`,
    row.type,
    url,
    publishDate,
    row.schema,
    `"${row.meta}"`,
    `"${row.desc}"`,
    `"${row.interlink}"`,
  ].join(",");
  csvLines.push(line);
});

fs.writeFileSync(OUTPUT_PATH, csvLines.join("\n"));
console.log(`Wrote ${rows.length} calendar rows to ${OUTPUT_PATH}`);
