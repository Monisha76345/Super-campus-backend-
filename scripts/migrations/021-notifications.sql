-- In-app notification inbox + Expo/FCM device tokens (per campus DB)

CREATE TABLE IF NOT EXISTS `notification` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `category` varchar(32) NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `data` json NULL,
  `actorId` varchar(36) NULL,
  `readAt` datetime(6) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_notification_user_created` (`userId`, `createdAt`),
  KEY `IDX_notification_user_unread` (`userId`, `readAt`, `createdAt`),
  KEY `IDX_notification_category` (`userId`, `category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `device_token` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `token` varchar(512) NOT NULL,
  `platform` varchar(16) NOT NULL DEFAULT 'UNKNOWN',
  `lastSeenAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_device_token_token` (`token`),
  KEY `IDX_device_token_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_preference` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `messagesEnabled` tinyint NOT NULL DEFAULT 1,
  `projectsEnabled` tinyint NOT NULL DEFAULT 1,
  `outpassEnabled` tinyint NOT NULL DEFAULT 1,
  `sportsEnabled` tinyint NOT NULL DEFAULT 1,
  `marketplaceEnabled` tinyint NOT NULL DEFAULT 1,
  `connectEnabled` tinyint NOT NULL DEFAULT 1,
  `campusEnabled` tinyint NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_notification_preference_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
