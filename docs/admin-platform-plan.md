# Admin Platform Enablement Plan

This document turns the Techverse admin requirements into an actionable build plan that we can implement incrementally without losing sight of the long‑term roadmap.

## RBAC & Scope Matrix

| Role          | Core Scopes                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------- |
| super_admin   | `*` (all scopes) + security (billing, MFA, API keys)                                           |
| editor        | `content:read`, `content:edit`, `content:publish`, `menus:edit`, `homepage:edit`, `calendar:edit` |
| author        | `content:create`, `content:edit_own`, `media:upload`                                           |
| seo_adops     | `seo:edit`, `schema:edit`, `ads:manage`, `consent:edit`, `redirects:edit`, `experiments:edit`   |
| moderator     | `ugc:review`, `ugc:takedown`, `ugc:settings`                                                   |
| developer     | `tools:toggle`, `feature_flags:manage`, `deploy:run`, `jobs:run`                               |
| viewer        | `analytics:read`, `reports:read`                                                               |

Implementation notes:

- Persist scopes JSON on the `roles` table and cache in Redis in the future if needed.
- Middleware: `requireScopes(["content:publish"])` style guard maps each API route to scopes.
- Include audit logging for all state-changing requests (user, action, payload hash).

## Admin Portal Rollout

### Phase 1 (MVP)

- **Authentication**: email + Argon2 passwords, optional Google OAuth; TOTP 2FA; JWT sessions stored as httpOnly cookies with `sessions` table for revocation.
- **Dashboard**: cards for publish queue, overdue edits, broken links, CWV snapshot, AdSense/GA4 revenue.
- **Content CMS**: Markdown editor + frontmatter (verse, slug, title, type, meta, schema presets, `publish_at`).
- **Calendar**: sync with `content-calendar.csv`, drag-and-drop reschedule updates `articles.publish_at`.
- **Internal Link Suggester**: service recommends 3–5 same-verse links + 1 cross-verse.
- **Media pipeline**: upload, auto WebP + responsive variants stored in `/media`.
- **SEO controls**: per-post meta + canonical + JSON-LD presets + OG image generator per verse.
- **Build & Publish**: “Generate Site” button calls `/api/build`, writes to `/site`, purges cache, pings sitemaps.
- **Menus/Homepage**: manage mega-menu entries, featured cards.
- **Ads & Consent**: configure AdSense IDs, slot toggles, sticky placements, consent banner copy.

### Phase 2 (Advanced)

- Redirect manager (CSV import/export).
- Experiments (A/B) with variant targeting and slot assignment.
- Search tools: rebuild `search-index.json`, manage synonyms.
- Tools Manager: enable/disable internal productivity tools, edit copy.
- Optional UGC/comments moderation queue with spam heuristics.
- API keys vault storing GA4, AdSense, SMTP, etc. with encryption at rest.

### Phase 3 (Automation)

- Inline auto-linking background job.
- Broken link crawler with one-click fix (redirect/suppress).
- Content quality checks (headings, length, alt text, schema coverage).
- Revenue optimization suggestions (layout + viewability tips).

## Data Model & Storage

Use MySQL for transactional data plus filesystem mirrors under `/content/{verse}/{slug}.md` to keep static builds Git-friendly. Tables requested: `users`, `roles`, `sessions`, `verses`, `articles`, `tags`, `article_tags`, `media`, `redirects`, `menus`, `settings`, `experiments`, `jobs`, `webhooks`. Add:

- `article_recommendations` (optional cache for link suggester).
- `ugc_queue` (when comments enabled).
- `api_keys` stored encrypted (Phase 2).

## API Surface (Node/Express)

| Route                           | Description / Required Scopes                                   |
| ------------------------------- | --------------------------------------------------------------- |
| `POST /api/auth/login`          | email/password login, returns JWT + sets session cookie         |
| `POST /api/auth/2fa/verify`     | verify TOTP, issue session                                      |
| `POST /api/auth/logout`         | invalidate session                                              |
| `GET/POST /api/articles`        | list/create articles (`content:read` / `content:create`)        |
| `GET/PATCH /api/articles/:id`   | view/update article (`content:edit` or `content:edit_own`)     |
| `POST /api/articles/:id/publish`| transition to published + trigger build (`content:publish`)     |
| `POST /api/build`               | trigger static generator + sitemap/search rebuild (`deploy:run`)|
| `POST /api/sitemap/ping`        | wraps `/admin/ping-sitemaps`                                    |
| `GET/PATCH /api/settings`       | ads, consent, analytics (`ads:manage`, `consent:edit`)          |
| `GET/POST /api/redirects`       | manage redirects                                                |
| `GET/POST /api/menus`           | manage menus/homepage layouts                                   |
| `POST /api/media`               | upload + optimize media (`media:upload`)                        |
| `GET /api/jobs`                 | list job queue                                                  |
| `POST /api/jobs/run`            | run tasks (crawler, rebuild, relink)                            |

All routes sit behind auth middleware with CSRF tokens for mutations, rate limiting, Helmet, and input validation/sanitization of Markdown.

## Static Build Pipeline

1. Load published articles from DB and `/content` mirror.
2. Render Markdown → HTML via verse-specific templates (insert ad slots, internal link widgets, JSON-LD).
3. Write to `/site/{verse}/{slug}.html` and update `site/assets/search-index.json`.
4. Update `sitemap.xml (lastmod)` and call `/admin/ping-sitemaps`.
5. Purge CDN/cache if configured.
6. Triggered by manual “Generate Site”, article publish, schedules, menus, redirects/job updates.

## Jobs & Scheduling

| Cadence | Jobs                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------- |
| Hourly  | Publish scheduled posts, ping sitemaps for new URLs                                                   |
| Daily   | 02:00 search index rebuild, broken link crawler report, email digest                                  |
| Weekly  | Redirect validation, unused media cleanup, content quality scan                                       |
| Monthly | DB + `/content` backups, JWT key rotation                                                             |

Jobs persist to `jobs` table with payload JSON, `status` enum, timestamps, and `result_json` for logs. `/api/jobs` exposes monitoring + manual triggers.

## Observability & Reporting

- GA4 and AdSense imports for analytics/revenue dashboards (RPM, viewability).
- Search Console integration (clicks, impressions, CTR by verse).
- Lighthouse CI runs for top URLs (CLS/LCP/INP trends).
- Ops metrics: error logs, job failures, 404/500 counts, broken links list.

## Security & Compliance

- HTTPS + HSTS via Helmet, secure/httpOnly cookies, JWT rotation, rate limiting, CSRF protection.
- Input sanitization for Markdown, escaping HTML.
- Backups encrypted with 90‑day retention.
- Emergency kill switches stored in `settings` (disable ads/tools/verse).

## Deployment & DevOps

- CI (main branch) runs unit tests + static site build, deploys Express app (PM2).
- Version `/site` artifacts for rollback.
- Environment variables: `SITE_URL`, `DB_*`, `JWT_SECRET`, `SMTP_*`, `GOOGLE_OAUTH_*`, etc.

## Quick-Start Backlog

1. Stand up `/admin` shell with auth + RBAC middleware.
2. Build Markdown article editor + filesystem mirror sync.
3. Implement static generator + `/api/build`.
4. Calendar scheduler and publish automation.
5. Menus/mega-menu UI + ads/consent settings wired to templates.
6. Search index rebuild + sitemap ping job hooks.
7. Redirect manager + broken link job integration.
8. Analytics/AdSense reporting widgets and experiments manager.

