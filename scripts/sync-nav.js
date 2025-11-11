"use strict";

const fs = require("fs");
const path = require("path");

const SITE_DIR = path.join(__dirname, "..", "site");
const INDEX_PATH = path.join(SITE_DIR, "index.html");
const indexContent = fs.readFileSync(INDEX_PATH, "utf8");

const navMatch = indexContent.match(
  /<!-- SITE-NAV-START -->[\s\S]*?<!-- SITE-NAV-END -->/,
);

if (!navMatch) {
  throw new Error("Unable to locate nav block in index.html");
}

const navBlock = navMatch[0];

const htmlFiles = [];
const stack = [SITE_DIR];

while (stack.length) {
  const current = stack.pop();
  const entries = fs.readdirSync(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      stack.push(path.join(current, entry.name));
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(path.join(current, entry.name));
    }
  }
}

htmlFiles.forEach((file) => {
  if (file === INDEX_PATH) return;
  const content = fs.readFileSync(file, "utf8");
  const hasNav = content.includes("<!-- SITE-NAV-START -->");
  if (!hasNav) return;
  const updated = content.replace(
    /<!-- SITE-NAV-START -->[\s\S]*?<!-- SITE-NAV-END -->/,
    navBlock,
  );
  fs.writeFileSync(file, updated);
});

console.log(`Synced nav into ${htmlFiles.length - 1} files.`);
