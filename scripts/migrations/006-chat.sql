-- Chat: Direct and group message threads, participants, and message history.
-- Applied on startup to every configured campus database. Safe to run more than once.

CREATE TABLE IF NOT EXISTS `chat_thread` (
  `id` varchar(36) NOT NULL,
  `type` enum('DIRECT','GROUP') NOT NULL DEFAULT 'DIRECT',
  `lastMessageText` varchar(500) NULL,
  `lastMessageAt` datetime(6) NULL,
  `lastSenderId` varchar(36) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_chat_thread_lastMessageAt` (`lastMessageAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_participant` (
  `id` varchar(36) NOT NULL,
  `threadId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `lastReadAt` datetime(6) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_chat_thread_user` (`threadId`, `userId`),
  KEY `IDX_chat_participant_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_message` (
  `id` varchar(36) NOT NULL,
  `threadId` varchar(36) NOT NULL,
  `senderId` varchar(36) NOT NULL,
  `content` varchar(2000) NOT NULL,
  `status` enum('SENT','DELIVERED','READ') NOT NULL DEFAULT 'SENT',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_chat_message_thread_created` (`threadId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
