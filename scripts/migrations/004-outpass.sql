-- Outpass request table for hostel residents
-- Supports student request lifecycle: PENDING -> APPROVED / REJECTED -> ACTIVE -> COMPLETED / OVERDUE

CREATE TABLE IF NOT EXISTS `outpass_request` (
  `id` varchar(36) NOT NULL,
  `studentId` varchar(36) NOT NULL,
  `studentName` varchar(120) NULL,
  `usn` varchar(40) NULL,
  `roomNumber` varchar(40) NULL,
  `parentPhone` varchar(25) NULL,
  `destination` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `departureTime` datetime(6) NOT NULL,
  `returnTime` datetime(6) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','ACTIVE','COMPLETED','CANCELLED','OVERDUE') NOT NULL DEFAULT 'PENDING',
  `reviewedBy` varchar(36) NULL,
  `reviewedAt` datetime(6) NULL,
  `rejectionReason` text NULL,
  `actualExitTime` datetime(6) NULL,
  `actualEntryTime` datetime(6) NULL,
  `qrToken` varchar(100) NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_outpass_student` (`studentId`),
  KEY `idx_outpass_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
