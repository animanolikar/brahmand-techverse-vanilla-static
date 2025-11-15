# Calendar & Scheduler Plan

## Goals

1. Calendar UI under `/admin/calendar.html` showing month/week views with article statuses.
2. Drag-to-reschedule interactions that update `articles.publish_at`.
3. Scheduler worker that promotes `scheduled` → `published` when `publish_at <= now` and triggers static builds.

## API requirements

| Endpoint | Description | Scopes |
| -------- | ----------- | ------ |
| `GET /api/calendar/events?start=&end=` | Returns articles whose `publish_at` falls within the range. | `content:read` |
| `PATCH /api/calendar/events/:id` | Update `publish_at`, `status` (draft/review/scheduled). | `content:edit` |
| `POST /api/calendar/events/:id/move` | Drag-drop convenience endpoint (old date -> new date). | `content:edit` |
| `POST /api/scheduler/run` | Manual trigger for scheduler job. | `jobs:run` |

## Data model notes

- `articles.publish_at` will store ISO timestamp; calendar fetch filters by range.
- Add `articles.scheduled_by`? (optional) for audit logs.
- `jobs` table will record scheduler runs (`type = "scheduler_publish"`).

## Scheduler logic

1. Every hour (cron) run `SELECT * FROM articles WHERE status='scheduled' AND publish_at <= NOW()`.
2. For each row:
   - Update `status` to `published`.
   - Set `updated_by` to system.
   - Enqueue build (reuse `triggerBuild()`).
   - Append to scheduler job log.
3. Send summary to admin dashboard (jobs feed + scheduler status card).

## Calendar UI

- Month view grid, week view toggle.
- Color-coded statuses: draft (gray), review (yellow), scheduled (blue), published (green).
- Dragging an event calls `PATCH /api/calendar/events/:id` with new `publish_at`.
- Quick actions: "Create draft", "Publish now", "Open editor".
- Tooltips show verse, schema type, recommended links, preview.

## Dashboard integration

- Add scheduler status card on dashboard summarizing:
  - Next run time.
  - Last run outcome.
  - Number of articles scheduled in next 7 days.
- Provide manual "Run scheduler" button calling `/api/scheduler/run`.

## Implementation phases

1. **APIs**: build calendar events endpoints + scheduler trigger (without UI).
2. **UI**: React-less vanilla calendar (maybe using FullCalendar via CDN) under `/admin/calendar.html`.
3. **Scheduler worker**: script under `scripts/run-scheduler.js` invoked manually + later via cron/PM2.
4. **Dashboard update**: display scheduler card + link to calendar.

