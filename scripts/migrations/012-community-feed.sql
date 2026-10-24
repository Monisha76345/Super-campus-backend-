-- Migration: 012-community-feed.sql
-- Description: Single table for campus community feed (posts, media, likes, comments)

CREATE TABLE IF NOT EXISTS `community_posts` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `authorId` varchar(36) NOT NULL,
  `authorName` varchar(255) NOT NULL,
  `authorRole` varchar(64) NOT NULL DEFAULT 'STUDENT',
  `authorHandle` varchar(255) NULL,
  `authorAvatar` text NULL,
  `content` text NOT NULL,
  `mediaUrls` json NULL COMMENT 'JSON array of image/video URLs: ["url1", "url2"]',
  `visibility` enum('ONLY_ME','CAMPUS','PUBLIC') NOT NULL DEFAULT 'CAMPUS',
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
  `rejectionReason` varchar(255) NULL,
  `likeCount` int NOT NULL DEFAULT 0,
  `likedUserIds` json NULL COMMENT 'JSON array of user IDs: ["u1", "u2"]',
  `commentCount` int NOT NULL DEFAULT 0,
  `comments` json NULL COMMENT 'JSON array of comment objects',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_community_campus` (`campusId`),
  KEY `idx_community_status` (`status`),
  KEY `idx_community_author` (`authorId`),
  KEY `idx_community_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
