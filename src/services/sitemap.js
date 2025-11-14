"use strict";

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetchFn }) => fetchFn(...args));

const searchEngines = [
  { name: "Google", endpoint: "https://www.google.com/ping?sitemap=" },
  { name: "Bing", endpoint: "https://www.bing.com/ping?sitemap=" },
];

async function pingSearchEngines(sitemapUrl) {
  const results = [];

  for (const engine of searchEngines) {
    try {
      const response = await fetch(`${engine.endpoint}${encodeURIComponent(sitemapUrl)}`);
      results.push({
        engine: engine.name,
        ok: response.ok,
        status: response.status,
      });
    } catch (error) {
      results.push({
        engine: engine.name,
        ok: false,
        error: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  searchEngines,
  pingSearchEngines,
};

