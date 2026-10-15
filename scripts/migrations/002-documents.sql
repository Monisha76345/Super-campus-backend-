-- Uploaded file records. The file itself is stored in MinIO.
-- Applied on startup to every configured campus database. Safe to run more than once.

CREATE TABLE IF NOT EXISTS `document` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `refId` varchar(100) NOT NULL,
  `refType` enum('user','community','food','outpass','sports','marketplace','project','internship','other') NOT NULL,
  `type` varchar(30) NOT NULL,
  `mimeType` varchar(127) NOT NULL,
  `location` varchar(500) NULL,
  `contentId` varchar(100) NULL,
  `url` varchar(500) NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_document_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_meta_info` (
  `id` varchar(36) NOT NULL,
  `refId` varchar(255) NULL,
  `refType` varchar(255) NULL,
  `entityId` varchar(255) NULL,
  `entityType` varchar(255) NULL,
  `userId` varchar(255) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
