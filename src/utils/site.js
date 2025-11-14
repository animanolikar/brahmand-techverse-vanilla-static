"use strict";

function resolveSiteUrl(port = process.env.PORT || 3000) {
  const siteUrl = process.env.SITE_URL || `http://localhost:${port}`;
  return siteUrl.replace(/\/$/, "");
}

module.exports = {
  resolveSiteUrl,
};

