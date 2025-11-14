-- Brahmand Techverse Admin Schema
-- MySQL 8.0+ (utf8mb4 + InnoDB)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS brahmand_admin
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE brahmand_admin;

CREATE TABLE IF NOT EXISTS roles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  scopes        JSON NOT NULL,
  description   VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(255) NOT NULL,
  password_hash  VARBINARY(255) NOT NULL,
  role_id        BIGINT UNSIGNED NOT NULL,
  mfa_enabled    TINYINT(1) NOT NULL DEFAULT 0,
  mfa_secret     VARBINARY(255) DEFAULT NULL,
  last_login_at  DATETIME DEFAULT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  jwt_id        CHAR(36) NOT NULL,
  ip_address    VARBINARY(16) DEFAULT NULL,
  user_agent    VARCHAR(512) DEFAULT NULL,
  issued_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  revoked_at    DATETIME DEFAULT NULL,
  UNIQUE KEY uq_sessions_jwt (jwt_id),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verses (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code      VARCHAR(32) NOT NULL,
  title     VARCHAR(120) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_verses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  verse_id      BIGINT UNSIGNED NOT NULL,
  slug          VARCHAR(160) NOT NULL,
  status        ENUM('draft','review','scheduled','published') NOT NULL DEFAULT 'draft',
  title         VARCHAR(255) NOT NULL,
  type          VARCHAR(100) DEFAULT NULL,
  meta_title    VARCHAR(255) DEFAULT NULL,
  meta_desc     VARCHAR(320) DEFAULT NULL,
  schema_type   ENUM('none','faq','howto','custom') NOT NULL DEFAULT 'none',
  publish_at    DATETIME DEFAULT NULL,
  body_md       LONGTEXT NOT NULL,
  html_cache    LONGTEXT DEFAULT NULL,
  og_image_path VARCHAR(255) DEFAULT NULL,
  canonical_url VARCHAR(255) DEFAULT NULL,
  created_by    BIGINT UNSIGNED NOT NULL,
  updated_by    BIGINT UNSIGNED DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_articles_slug (slug),
  KEY idx_articles_status_publish (status, publish_at),
  KEY idx_articles_verse (verse_id),
  CONSTRAINT fk_articles_verse FOREIGN KEY (verse_id) REFERENCES verses (id),
  CONSTRAINT fk_articles_created_by FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT fk_articles_updated_by FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(120) NOT NULL,
  slug      VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id BIGINT UNSIGNED NOT NULL,
  tag_id     BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  CONSTRAINT fk_article_tags_article FOREIGN KEY (article_id) REFERENCES articles (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_article_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  path         VARCHAR(255) NOT NULL,
  width        INT DEFAULT NULL,
  height       INT DEFAULT NULL,
  mime         VARCHAR(100) NOT NULL,
  alt_text     VARCHAR(255) DEFAULT NULL,
  uploaded_by  BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata     JSON DEFAULT NULL,
  UNIQUE KEY uq_media_path (path),
  KEY idx_media_uploader (uploaded_by),
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS redirects (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_path    VARCHAR(255) NOT NULL,
  to_path      VARCHAR(255) NOT NULL,
  http_code    SMALLINT NOT NULL DEFAULT 301,
  created_by   BIGINT UNSIGNED NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_redirects_from (from_path),
  CONSTRAINT fk_redirects_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  area         ENUM('header','mega','footer','homepage') NOT NULL,
  label        VARCHAR(120) NOT NULL,
  url          VARCHAR(255) NOT NULL,
  verse_id     BIGINT UNSIGNED DEFAULT NULL,
  parent_id    BIGINT UNSIGNED DEFAULT NULL,
  order_index  INT NOT NULL DEFAULT 0,
  metadata     JSON DEFAULT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_menus_verse FOREIGN KEY (verse_id) REFERENCES verses (id),
  CONSTRAINT fk_menus_parent FOREIGN KEY (parent_id) REFERENCES menus (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(120) NOT NULL,
  value_json  JSON NOT NULL,
  updated_by  BIGINT UNSIGNED DEFAULT NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_settings_key (config_key),
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experiments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experiment_key VARCHAR(120) NOT NULL,
  description   VARCHAR(255) DEFAULT NULL,
  variants      JSON NOT NULL,
  enabled       TINYINT(1) NOT NULL DEFAULT 0,
  created_by    BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_experiments_key (experiment_key),
  CONSTRAINT fk_experiments_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_type      VARCHAR(80) NOT NULL,
  payload_json  JSON DEFAULT NULL,
  status        ENUM('pending','running','success','failed') NOT NULL DEFAULT 'pending',
  priority      TINYINT NOT NULL DEFAULT 5,
  run_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at    DATETIME DEFAULT NULL,
  finished_at   DATETIME DEFAULT NULL,
  result_json   JSON DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_by    BIGINT UNSIGNED DEFAULT NULL,
  CONSTRAINT fk_jobs_user FOREIGN KEY (created_by) REFERENCES users (id),
  KEY idx_jobs_status_run_at (status, run_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhooks (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url         VARCHAR(255) NOT NULL,
  event       VARCHAR(120) NOT NULL,
  secret      VARBINARY(255) NOT NULL,
  enabled     TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_webhooks_event_url (event, url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_keys (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service       VARCHAR(120) NOT NULL,
  key_name      VARCHAR(120) NOT NULL,
  cipher_text   VARBINARY(2048) NOT NULL,
  created_by    BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_api_keys_service_name (service, key_name),
  CONSTRAINT fk_api_keys_user FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ugc_queue (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id     BIGINT UNSIGNED NOT NULL,
  author_name    VARCHAR(120) DEFAULT NULL,
  author_email   VARCHAR(255) DEFAULT NULL,
  content_md     TEXT NOT NULL,
  status         ENUM('pending','approved','rejected','spam') NOT NULL DEFAULT 'pending',
  spam_score     DECIMAL(5,2) DEFAULT NULL,
  metadata       JSON DEFAULT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by    BIGINT UNSIGNED DEFAULT NULL,
  reviewed_at    DATETIME DEFAULT NULL,
  CONSTRAINT fk_ugc_article FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
  CONSTRAINT fk_ugc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article_recommendations (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id      BIGINT UNSIGNED NOT NULL,
  recommendations JSON NOT NULL,
  generated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_article_recommendations (article_id),
  CONSTRAINT fk_rec_article FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
