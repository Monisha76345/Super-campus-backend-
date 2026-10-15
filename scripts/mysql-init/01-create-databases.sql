-- Runs once, on first MySQL volume creation.
-- global is created by MYSQL_DATABASE. Campus tenants are created here.

CREATE DATABASE IF NOT EXISTS supercampus_nmit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON supercampus_global.* TO 'supercampus'@'%';
GRANT ALL PRIVILEGES ON supercampus_nmit.* TO 'supercampus'@'%';
FLUSH PRIVILEGES;
