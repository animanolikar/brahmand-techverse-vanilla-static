"use strict";

const ROLE_SCOPES = {
  super_admin: ["*"],
  editor: [
    "content:read",
    "content:edit",
    "content:publish",
    "menus:edit",
    "homepage:edit",
    "calendar:edit",
    "media:upload",
  ],
  author: ["content:read", "content:create", "content:edit_own", "media:upload"],
  seo_adops: [
    "content:read",
    "seo:edit",
    "schema:edit",
    "ads:manage",
    "consent:edit",
    "redirects:edit",
    "experiments:edit",
    "sitemaps:ping",
  ],
  moderator: ["content:read", "ugc:review", "ugc:takedown"],
  developer: [
    "content:read",
    "tools:toggle",
    "feature_flags:manage",
    "deploy:run",
    "jobs:run",
    "experiments:edit",
  ],
  viewer: ["analytics:read", "reports:read"],
};

const DEFAULT_ROLE = "viewer";

const unique = (scopes) => Array.from(new Set(scopes));

function getScopesForRole(roleName = DEFAULT_ROLE) {
  const normalized = String(roleName || DEFAULT_ROLE).toLowerCase();
  const scopes = ROLE_SCOPES[normalized] || ROLE_SCOPES[DEFAULT_ROLE];
  return unique(scopes);
}

function roleHasScope(roleName, scope) {
  const scopes = getScopesForRole(roleName);
  return scopes.includes("*") || scopes.includes(scope);
}

module.exports = {
  ROLE_SCOPES,
  DEFAULT_ROLE,
  getScopesForRole,
  roleHasScope,
};

