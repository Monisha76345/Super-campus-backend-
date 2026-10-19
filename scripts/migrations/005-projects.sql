-- Projects schema for collaborative projects, team recruitment, mentoring, and funding
-- Supports project lifecycle: OPEN -> ACTIVE -> COMPLETED -> ARCHIVED

CREATE TABLE IF NOT EXISTS `projects` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `creatorId` varchar(36) NOT NULL,
  `creatorName` varchar(120) NULL,
  `creatorUsn` varchar(40) NULL,
  `title` varchar(140) NOT NULL,
  `shortDescription` varchar(200) NOT NULL,
  `moreDetails` text NULL,
  `category` enum('Academic','Hackathon','Startup','Research','Social impact','Open source') NOT NULL DEFAULT 'Academic',
  `stage` enum('Idea','Planning','Prototype','In Progress','Completed') NOT NULL DEFAULT 'Idea',
  `status` enum('OPEN','ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'OPEN',
  `duration` varchar(50) NOT NULL DEFAULT '3 - 6 Months',
  `location` varchar(120) NOT NULL DEFAULT 'NMIT North Campus',
  `visibility` enum('CAMPUS_ONLY','PUBLIC') NOT NULL DEFAULT 'CAMPUS_ONLY',
  `bannerUrl` varchar(500) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_creator` (`creatorId`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_skills` (
  `id` varchar(36) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `skillName` varchar(80) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_skill_project` (`projectId`),
  CONSTRAINT `fk_skill_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_support` (
  `id` varchar(36) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `serviceType` enum('HIRE_STUDENTS','HIRE_MENTOR','COLLEGE_FUNDING','CROWDFUNDING') NOT NULL,
  `rolesNeeded` varchar(255) NULL,
  `numberOfStudents` varchar(50) NULL,
  `commitment` varchar(50) NULL,
  `preferredSkills` varchar(255) NULL,
  `mentorDomain` varchar(255) NULL,
  `fundingDetails` varchar(255) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_support_project` (`projectId`),
  CONSTRAINT `fk_support_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_media` (
  `id` varchar(36) NOT NULL,
  `projectId` varchar(36) NOT NULL,
  `mediaType` varchar(20) NOT NULL DEFAULT 'IMAGE',
  `fileUrl` varchar(500) NOT NULL,
  `fileName` varchar(255) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_media_project` (`projectId`),
  CONSTRAINT `fk_media_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
