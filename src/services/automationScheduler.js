"use strict";

const { runTrendPipeline } = require("./automationService");

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // one hour
let automationTimer = null;
let automationRunning = false;

function getIntervalMs() {
  const envInterval = Number(process.env.TREND_PIPELINE_INTERVAL_MS);
  if (!Number.isNaN(envInterval) && envInterval > 0) {
    return envInterval;
  }
  return DEFAULT_INTERVAL_MS;
}

async function runAutomationCycle() {
  if (automationRunning) {
    console.log("[automation] Trend pipeline skipped (previous run still in progress)");
    return;
  }
  automationRunning = true;
  const startedAt = new Date();
  console.log(`[automation] Trend pipeline started at ${startedAt.toISOString()}`);
  try {
    const result = await runTrendPipeline();
    console.log(
      `[automation] Trend pipeline finished (${result.steps.join(" -> ")}) at ${result.completed_at}`,
    );
  } catch (error) {
    console.error("[automation] Trend pipeline failed:", error);
  } finally {
    automationRunning = false;
  }
}

function startTrendAutomation() {
  if (automationTimer) {
    return;
  }

  const intervalMs = getIntervalMs();
  console.log(
    `[automation] Starting hourly trend pipeline (every ${Math.round(intervalMs / 60000)} minutes)`,
  );
  runAutomationCycle();
  automationTimer = setInterval(runAutomationCycle, intervalMs);
}

function stopTrendAutomation() {
  if (automationTimer) {
    clearInterval(automationTimer);
    automationTimer = null;
  }
}

module.exports = {
  startTrendAutomation,
  stopTrendAutomation,
};
