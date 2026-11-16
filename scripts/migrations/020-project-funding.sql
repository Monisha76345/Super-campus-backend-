-- 020-project-funding.sql
-- Add funding metrics to projects and create contributions and applications tables

ALTER TABLE `projects`
  ADD COLUMN `fundingTarget` decimal(10,2) NOT NULL DEFAULT '0.00' AFTER `visibility`,
  ADD COLUMN `fundingRaised` decimal(10,2) NOT NULL DEFAULT '0.00' AFTER `fundingTarget`,
  ADD COLUMN `backersCount` int NOT NULL DEFAULT 0 AFTER `fundingRaised`;

CREATE TABLE IF NOT EXISTS `project_contributions` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `contributorName` varchar(120) NOT NULL,
  `contributorEmail` varchar(255) NULL,
  `contributorRole` varchar(64) NULL,
  `fundingType` enum('COLLEGE_FUNDING', 'CROWDFUNDING') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(50) NOT NULL DEFAULT 'CAMPUS_PAY',
  `transactionId` varchar(100) NOT NULL,
  `orderId` varchar(100) NULL,
  `paymentStatus` enum('PENDING', 'VERIFIED', 'FAILED') NOT NULL DEFAULT 'VERIFIED',
  `notes` text NULL,
  `verifiedAt` datetime NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_contrib_project` (`projectId`),
  KEY `idx_contrib_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_applications` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `applicantName` varchar(120) NOT NULL,
  `applicantEmail` varchar(255) NULL,
  `applicantRole` varchar(64) NULL,
  `applicantUsn` varchar(50) NULL,
  `supportId` varchar(36) NULL,
  `roleApplied` varchar(100) NOT NULL,
  `message` text NULL,
  `status` enum('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_app_project` (`projectId`),
  KEY `idx_app_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

