-- One profile row per account. Education, experience, and skills are JSON on this row.
-- The photo file stays in MinIO. photoDocumentId and photoKey point at that file.
-- Applied on startup. Safe to run more than once.

CREATE TABLE IF NOT EXISTS `profile` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `firstName` varchar(80) NULL,
  `lastName` varchar(80) NULL,
  `handle` varchar(40) NULL,
  `graduationYear` smallint NULL,
  `visibility` enum('private','campus','public') NOT NULL DEFAULT 'campus',
  `residency` enum('not_set','day_scholar','hostel_resident') NOT NULL DEFAULT 'not_set',
  `bio` varchar(500) NULL,
  `photoDocumentId` int NULL,
  `photoKey` varchar(100) NULL,
  `education` json NULL,
  `experience` json NULL,
  `skills` json NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_profile_userId` (`userId`),
  UNIQUE KEY `UQ_profile_handle` (`handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
