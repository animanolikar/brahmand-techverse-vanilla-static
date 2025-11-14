# Article CMS & Build Pipeline Design

This note captures the core contracts between the database, filesystem mirror, admin UI, and static generator. It guides Batch 1 implementation.

## Data flow overview

```
Admin UI (Markdown editor)
    ↓ /api/articles (create/update/review/publish)
Article Service (DB + /content mirror)
    ↓ writes
MySQL (articles, tags, verses, users)
/content/{verse}/{slug}.md (frontmatter + markdown body)
    ↓ build trigger
Static Generator
    ↓ outputs
/site/{verse}/{slug}.html + sitemap.xml + assets/search-index.json
```

### Article record shape

`articles` table holds metadata and status. Frontmatter stored in Markdown mirror:

```yaml
---
verse: techverse
slug: edge-ai-sensors
title: Edge AI sensors for rail safety
status: draft/review/scheduled/published
type: essay/howto/faq
meta_title: optional
meta_desc: optional
schema_type: none/faq/howto/custom
publish_at: 2024-11-08T10:00:00Z
tags: ["ai", "rail"]
canonical_url: optional
---

Markdown content…
```

### API contracts

- `GET /api/articles?verse=&status=&page=` → paginated list, includes derived fields (word count, scheduled time, mirror path status).
- `POST /api/articles` → create article, persist DB row + `/content/{verse}/{slug}.md`.
- `GET /api/articles/:id` → fetch metadata + Markdown body.
- `PATCH /api/articles/:id` → update metadata/body, sync mirror.
- `POST /api/articles/:id/publish` → transition to published, set `publish_at`, enqueue build.
- `POST /api/articles/:id/schedule` (alias) → status `scheduled` + `publish_at` timestamp; cron will publish when due.

All endpoints require relevant scopes (`content:create`, `content:edit`, `content:publish`).

## Filesystem mirror

- Location: `/content/{verse_code}/{slug}.md`.
- Use `fs.mkdirSync(..., { recursive: true })` when writing.
- On save, update DB `updated_by`, `updated_at`, and optional `html_cache`.
- On delete (future), remove Markdown file and mark status `archived`.

## Build pipeline requirements

1. Load published articles from DB (status `published` or `scheduled` past now) and Markdown files.
2. Render Markdown to HTML via verse-specific templates (inject hero, body, metadata, JSON-LD, ad slots, internal link widgets).
3. Write to `/site/{verse_code}/{slug}.html`.
4. Update `/site/assets/search-index.json`.
5. Update `/site/sitemap.xml` (`<lastmod>` = `publish_at` or `updated_at`).
6. Trigger cache/CDN purge as needed (placeholder now).
7. Return build job status and log to `jobs`.

## Internal link suggester

- Stub service for now: gather latest published slugs by verse and suggest 3 same-verse + 1 cross-verse.
- Future: use `article_recommendations` table to cache results per article.

## Editor UX requirements

- Split view: frontmatter form (title, slug, verse, tags, schema preset) + Markdown editor with preview.
- Auto-generate slug from title (editable).
- Surfaced warnings (missing meta, short content).
- "Save draft", "Submit for review", "Schedule", "Publish now" buttons mapped to statuses.
- Show recommended links (stub) and ability to insert `[link text](url)` snippet.
- Display file path + last saved timestamp.

## Build triggers

- Manual button (`POST /api/build`).
- On publish (`POST /api/articles/:id/publish`).
- On schedule time (cron job).
- On menus/redirects changes (future).

Each trigger enqueues job in `jobs` table with metadata, runs generator, updates result JSON, surfaces status in admin UI.

## Open questions / next iteration

- How to handle large body text in DB vs. filesystem (current plan keeps full Markdown in DB for easy queries + mirror for git friendliness).
- Versioning revisions (future: `article_revisions` table or git commits).
- Collaboration & comments (out of scope for Batch 1).
