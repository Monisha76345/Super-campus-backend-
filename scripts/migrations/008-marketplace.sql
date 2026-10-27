-- Migration: 008-marketplace.sql
-- Description: Marketplace items and likes for campus buy & sell with admin approval flow

CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `condition` enum('new','like new','good','fair','poor') NOT NULL DEFAULT 'good',
  `category` enum(
    'Uncategorized',
    'Bags & Luggage',
    'Bicycles',
    'Books & Study Material',
    'Clothing & Accessories',
    'Electronics',
    'Furniture',
    'Instruments & Equipment',
    'Other',
    'Sports & Fitness',
    'Stationery'
  ) NOT NULL DEFAULT 'Uncategorized',
  `images` text NULL COMMENT 'JSON array of image URLs',
  `sellerId` varchar(36) NOT NULL,
  `sellerName` varchar(255) NOT NULL,
  `sellerRole` varchar(64) NOT NULL DEFAULT 'STUDENT',
  `contactPhone` varchar(50) NULL,
  `contactEmail` varchar(255) NULL,
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED','SOLD') NOT NULL DEFAULT 'PENDING_APPROVAL',
  `rejectionReason` varchar(255) NULL,
  `approvedBy` varchar(36) NULL,
  `approvedAt` datetime NULL,
  `likeCount` int NOT NULL DEFAULT 0,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_marketplace_campus` (`campusId`),
  KEY `idx_marketplace_status` (`status`),
  KEY `idx_marketplace_category` (`category`),
  KEY `idx_marketplace_seller` (`sellerId`),
  KEY `idx_marketplace_created_at` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `marketplace_item_likes` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `itemId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_like_item_user` (`itemId`, `userId`),
  KEY `idx_like_user` (`userId`),
  KEY `idx_like_item` (`itemId`),
  CONSTRAINT `fk_marketplace_like_item` FOREIGN KEY (`itemId`) REFERENCES `marketplace_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
