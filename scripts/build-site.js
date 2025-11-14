"use strict";

require("../src/shims/patch-debug");

const { buildSite } = require("../src/services/staticGenerator");
const { pool } = require("../src/config/db");

buildSite()
  .then((summary) => {
    console.log(`Site build complete. Generated ${summary.count} articles.`);
    pool.end();
  })
  .catch((error) => {
    console.error("Build failed:", error);
    pool.end();
    process.exitCode = 1;
  });
