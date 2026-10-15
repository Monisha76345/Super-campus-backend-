-- Role access: campus directory, accounts, import batches, and the global login lookup.
-- Applied on startup to every configured campus database. Safe to run more than once.

CREATE TABLE IF NOT EXISTS `campus_directory` (
  `id` varchar(36) NOT NULL,
  `usn` varchar(32) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `collegeEmail` varchar(255) NOT NULL,
  `personalEmail` varchar(255) NULL,
  `mobile` varchar(20) NULL,
  `role` enum('STUDENT','FACULTY','ALUMNI','CAMPUS_ADMIN') NOT NULL,
  `isHostelite` tinyint NOT NULL DEFAULT 0,
  `department` varchar(120) NULL,
  `batch` varchar(32) NULL,
  `program` varchar(120) NULL,
  `status` enum('pending','active','graduated','disabled') NOT NULL DEFAULT 'pending',
  `userId` varchar(36) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_campus_directory_usn` (`usn`),
  UNIQUE KEY `UQ_campus_directory_collegeEmail` (`collegeEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(36) NOT NULL,
  `directoryId` varchar(36) NOT NULL,
  `loginId` varchar(255) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `changePasswordRequired` tinyint NOT NULL DEFAULT 0,
  `lastLoggedIn` datetime(6) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_directoryId` (`directoryId`),
  UNIQUE KEY `UQ_user_loginId` (`loginId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `import_batch` (
  `id` varchar(36) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `uploadedBy` varchar(255) NOT NULL,
  `status` enum('processing','done','failed') NOT NULL DEFAULT 'processing',
  `totalRows` int NOT NULL DEFAULT 0,
  `createdCount` int NOT NULL DEFAULT 0,
  `updatedCount` int NOT NULL DEFAULT 0,
  `skippedCount` int NOT NULL DEFAULT 0,
  `errorCount` int NOT NULL DEFAULT 0,
  `errorDetails` text NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `global_login` (
  `id` varchar(36) NOT NULL,
  `loginId` varchar(255) NOT NULL,
  `tenantId` varchar(64) NOT NULL,
  `directoryId` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_global_login_loginId` (`loginId`),
  KEY `IDX_global_login_directory` (`tenantId`, `directoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing databases created before mobile was added.
SET @mobile_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'campus_directory' AND COLUMN_NAME = 'mobile'
);
SET @mobile_sql := IF(
  @mobile_exists = 0,
  'ALTER TABLE `campus_directory` ADD COLUMN `mobile` varchar(20) NULL AFTER `personalEmail`',
  'SELECT 1'
);
PREPARE mobile_stmt FROM @mobile_sql;
EXECUTE mobile_stmt;
DEALLOCATE PREPARE mobile_stmt;
