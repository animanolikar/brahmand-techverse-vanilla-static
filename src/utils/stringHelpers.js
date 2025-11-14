"use strict";

function slugify(input) {
  if (!input) {
    return "";
  }

  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 160);
}

module.exports = {
  slugify,
};

