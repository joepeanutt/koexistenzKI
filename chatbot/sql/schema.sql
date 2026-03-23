CREATE DATABASE IF NOT EXISTS ki_news_admin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ki_news_admin;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_blocked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL,
  visits INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(255) NOT NULL,
  views INT NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  INDEX idx_page_views_date (date),
  INDEX idx_page_views_page (page)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  device VARCHAR(80) NOT NULL,
  browser VARCHAR(120) NOT NULL,
  INDEX idx_sessions_timestamp (timestamp),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optionaler Start-Admin (Passwort muss gehasht sein)
-- INSERT INTO users (username, email, password_hash) VALUES ('admin', 'admin@example.com', '$2b$10$replace_with_bcrypt_hash');
