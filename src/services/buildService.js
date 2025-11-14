"use strict";

const { buildSite } = require("./staticGenerator");
const { recordJob, updateJob, listJobs } = require("../utils/jobRecorder");
const { pingSearchEngines } = require("./sitemap");
const { resolveSiteUrl } = require("../utils/site");

function triggerBuild(triggeredBy = "system", payload = {}) {
  const job = recordJob("static_build", {
    triggered_by: triggeredBy,
    payload,
  });

  runJob(job);
  return job;
}

function runJob(job) {
  updateJob(job.id, { status: "running", started_at: new Date().toISOString() });

  buildSite()
    .then(async (summary) => {
      updateJob(job.id, {
        status: "success",
        finished_at: new Date().toISOString(),
        result: summary,
      });
      try {
        const sitemapUrl = `${resolveSiteUrl()}/sitemap.xml`;
        await pingSearchEngines(sitemapUrl);
      } catch (error) {
        updateJob(job.id, {
          status: "success_with_warning",
          warning: error.message,
        });
      }
    })
    .catch((error) => {
      updateJob(job.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error: error.message,
      });
    });
}

module.exports = {
  triggerBuild,
  listJobs,
};
