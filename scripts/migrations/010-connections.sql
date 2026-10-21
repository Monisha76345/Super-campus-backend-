-- 010-connections.sql
-- Table for member connection requests in the Connect module

CREATE TABLE IF NOT EXISTS `campus_connection` (
  `id` VARCHAR(36) NOT NULL,
  `requester_user_id` VARCHAR(36) NOT NULL,
  `receiver_user_id` VARCHAR(36) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_connection_pair` (`requester_user_id`, `receiver_user_id`),
  INDEX `idx_conn_receiver` (`receiver_user_id`, `status`),
  INDEX `idx_conn_requester` (`requester_user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
