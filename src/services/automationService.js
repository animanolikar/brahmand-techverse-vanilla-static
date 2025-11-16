"use strict";

const { promisify } = require("node:util");
const { exec } = require("node:child_process");

const runCommand = promisify(exec);

async function runScript(scriptPath) {
  await runCommand(`node ${scriptPath}`, { cwd: process.cwd(), env: process.env });
}

async function runBuild() {
  await runCommand("npm run build:site", { cwd: process.cwd(), env: process.env });
}

async function runTrendPipeline() {
  await runScript("scripts/fetch-trends.js");
  await runScript("scripts/generate-trend-articles.js");
  await runBuild();
  return {
    steps: [
      "fetch-trends",
      "generate-trend-articles",
      "build:site",
    ],
    completed_at: new Date().toISOString(),
  };
}

module.exports = {
  runTrendPipeline,
};

