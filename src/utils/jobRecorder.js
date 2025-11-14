"use strict";

const jobHistory = [];

function recordJob(jobType, meta = {}) {
  const job = {
    id: `job_${Date.now()}`,
    type: jobType,
    status: "queued",
    meta,
    created_at: new Date().toISOString(),
  };
  jobHistory.push(job);
  return job;
}

function updateJob(jobId, updates = {}) {
  const job = jobHistory.find((item) => item.id === jobId);
  if (!job) {
    return null;
  }
  Object.assign(job, updates);
  return job;
}

function listJobs(limit = 25) {
  return jobHistory.slice(-limit).reverse();
}

module.exports = {
  recordJob,
  updateJob,
  listJobs,
};
