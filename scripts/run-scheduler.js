"use strict";

require("../src/shims/patch-debug");

const { runScheduler } = require("../src/services/schedulerService");

runScheduler()
  .then((result) => {
    console.log(`Scheduler processed ${result.published.length} articles.`);
    result.published.forEach((article) => {
      console.log(`Published: ${article.slug} (id=${article.id})`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error("Scheduler failed:", error);
    process.exit(1);
  });

