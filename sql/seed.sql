-- Seed data for core tables

INSERT INTO verses (code, title, sort_order)
VALUES
  ('techverse', 'Techverse', 1),
  ('finverse', 'Finverse', 2),
  ('healthverse', 'Healthverse', 3),
  ('skillverse', 'Skillverse', 4)
ON DUPLICATE KEY UPDATE title = VALUES(title), sort_order = VALUES(sort_order);

INSERT INTO roles (name, scopes, description)
VALUES
  ('super_admin', JSON_ARRAY('*'), 'Full platform access'),
  ('editor', JSON_ARRAY('content:read','content:edit','content:publish','menus:edit','homepage:edit','calendar:edit','media:upload'), 'Editors who manage content'),
  ('author', JSON_ARRAY('content:read','content:create','content:edit_own','media:upload'), 'Authors with limited rights'),
  ('seo_adops', JSON_ARRAY('content:read','seo:edit','schema:edit','ads:manage','consent:edit','redirects:edit','experiments:edit','sitemaps:ping'), 'SEO & AdOps team'),
  ('moderator', JSON_ARRAY('content:read','ugc:review','ugc:takedown'), 'UGC moderators'),
  ('developer', JSON_ARRAY('content:read','tools:toggle','feature_flags:manage','deploy:run','jobs:run','experiments:edit'), 'Developers / ops'),
  ('viewer', JSON_ARRAY('analytics:read','reports:read'), 'Read-only analysts')
ON DUPLICATE KEY UPDATE scopes = VALUES(scopes), description = VALUES(description);

-- Example admin user (password hash placeholder)
-- Replace PASSWORD_HASH below with output from scripts/create-admin-user.js or Argon2 hash
-- INSERT INTO users (email, password_hash, role_id, mfa_enabled)
-- VALUES ('admin@brahmand.co', 'REPLACE_WITH_ARGON2_HASH', (SELECT id FROM roles WHERE name='super_admin'), 0);

-- Sample articles (expects an existing admin user)
INSERT INTO articles (
  verse_id, slug, status, title, type, meta_title, meta_desc,
  schema_type, publish_at, body_md, html_cache, created_by, updated_by
)
SELECT v.id, a.slug, a.status, a.title, 'article', a.meta_title, a.meta_desc,
       'none', a.publish_at, a.body_md, NULL, u.id, u.id
FROM (
  SELECT 'techverse' verse_code, 'ai-tool-stack' slug, 'published' status,
         'AI tool stack 2025' title, 'AI tool stack 2025 • Brahmand' meta_title,
         'Curated AI automation stack builders rely on for 2025.' meta_desc,
         '2024-11-08 10:00:00' publish_at,
         '# AI tool stack 2025\n\nPractical AI automations for builders.' body_md
  UNION ALL
  SELECT 'finverse','cash-flow-ladder','published','Cash-flow ladder for creators',
         'Cash-flow ladder • Brahmand',
         'Personal finance ladder to derisk cash burn.',
         '2024-11-06 09:00:00',
         '# Cash-flow ladder\n\nSIP vs RD vs FD and how to plan buffers.'
  UNION ALL
  SELECT 'healthverse','metabolic-mornings','scheduled','Metabolic mornings reboot',
         'Metabolic mornings • Brahmand',
         '7-day metabolic reset for founders working remote.',
         '2024-11-20 07:00:00',
         '# Metabolic mornings\n\nStack movement, breathwork, and nutrition.'
  UNION ALL
  SELECT 'skillverse','storytelling-drills','draft','Storytelling drills for PMs',
         'Storytelling drills • Brahmand',
         'Narrative drills for product leads heading into Q1 planning.',
         NULL,
         '# Storytelling drills\n\nTemplates to shape problem narratives.'
) a
JOIN verses v ON v.code = a.verse_code
JOIN users u ON u.email = 'admin@brahmand.co'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  meta_title = VALUES(meta_title),
  meta_desc = VALUES(meta_desc),
  publish_at = VALUES(publish_at),
  body_md = VALUES(body_md),
  updated_by = VALUES(updated_by),
  updated_at = NOW();

-- Header navigation seed
INSERT INTO menus (area, label, url, order_index)
SELECT 'header', 'Home', '/', 0
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE area='header' AND label='Home');

INSERT INTO menus (area, label, url, order_index)
SELECT 'header', 'Techverse', '/techverse/', 1
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE area='header' AND label='Techverse');

INSERT INTO menus (area, label, url, order_index)
SELECT 'header', 'Tools', '/tools/', 2
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE area='header' AND label='Tools');

INSERT INTO menus (area, label, url, order_index)
SELECT 'header', 'Search', '/search/', 3
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE area='header' AND label='Search');

-- Mega menu seed
INSERT INTO menus (area, label, url, verse_id, order_index)
SELECT 'mega', 'AI tool stack 2025', '/techverse/ai-tools.html', v.id, 0
FROM verses v
WHERE v.code = 'techverse'
  AND NOT EXISTS (
    SELECT 1 FROM menus WHERE area='mega' AND label='AI tool stack 2025'
  );

INSERT INTO menus (area, label, url, verse_id, order_index)
SELECT 'mega', 'Cash-flow ladder', '/finverse/cash-flow-ladder.html', v.id, 0
FROM verses v
WHERE v.code = 'finverse'
  AND NOT EXISTS (
    SELECT 1 FROM menus WHERE area='mega' AND label='Cash-flow ladder'
  );

INSERT INTO menus (area, label, url, verse_id, order_index)
SELECT 'mega', 'Metabolic mornings', '/healthverse/metabolic-mornings.html', v.id, 0
FROM verses v
WHERE v.code = 'healthverse'
  AND NOT EXISTS (
    SELECT 1 FROM menus WHERE area='mega' AND label='Metabolic mornings'
  );

INSERT INTO menus (area, label, url, verse_id, order_index)
SELECT 'mega', 'Storytelling drills', '/skillverse/storytelling-drills.html', v.id, 0
FROM verses v
WHERE v.code = 'skillverse'
  AND NOT EXISTS (
    SELECT 1 FROM menus WHERE area='mega' AND label='Storytelling drills'
  );
