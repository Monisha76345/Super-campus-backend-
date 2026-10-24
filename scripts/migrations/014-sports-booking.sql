-- Sports & Court Booking Module: facilities, bookings, team players, and closures
-- Applied to all campus databases

CREATE TABLE IF NOT EXISTS `sports_facilities` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sportType` varchar(64) NOT NULL DEFAULT 'BADMINTON',
  `venueType` varchar(32) NOT NULL DEFAULT 'INDOOR',
  `location` varchar(255) NOT NULL,
  `description` text NULL,
  `rules` text NULL,
  `openingTime` time NOT NULL DEFAULT '06:00:00',
  `closingTime` time NOT NULL DEFAULT '22:00:00',
  `slotDurationMinutes` int NOT NULL DEFAULT 60,
  `maxPlayers` int NOT NULL DEFAULT 4,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_sports_facilities_campus_sport` (`campusId`, `sportType`, `venueType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sports_bookings` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `facilityId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `userUsn` varchar(32) NULL,
  `bookingDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `status` enum('CONFIRMED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'CONFIRMED',
  `inviteCode` varchar(16) NOT NULL,
  `isOpenGame` tinyint NOT NULL DEFAULT 0,
  `maxPlayers` int NOT NULL DEFAULT 4,
  `currentPlayersCount` int NOT NULL DEFAULT 1,
  `notes` text NULL,
  `cancellationReason` text NULL,
  `qrToken` varchar(64) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_sports_bookings_facility_date` (`facilityId`, `bookingDate`, `status`),
  KEY `IDX_sports_bookings_user` (`userId`, `bookingDate`),
  KEY `IDX_sports_bookings_invite` (`inviteCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sports_booking_players` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `bookingId` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `userUsn` varchar(32) NULL,
  `role` enum('HOST','PLAYER') NOT NULL DEFAULT 'PLAYER',
  `qrToken` varchar(64) NOT NULL,
  `joinedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_sports_booking_player` (`bookingId`, `userId`),
  KEY `IDX_sports_players_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sports_facility_closures` (
  `id` varchar(36) NOT NULL,
  `campusId` varchar(64) NOT NULL,
  `facilityId` varchar(36) NOT NULL,
  `closureDate` date NOT NULL,
  `startTime` time NOT NULL,
  `endTime` time NOT NULL,
  `reason` varchar(255) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `createdBy` varchar(255) NULL,
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updatedBy` varchar(255) NULL,
  `deletedAt` datetime(6) NULL,
  `deletedBy` varchar(255) NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_sports_closures_date` (`facilityId`, `closureDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data for Sports Venues & Courts
INSERT IGNORE INTO `sports_facilities` (
  `id`, `campusId`, `name`, `sportType`, `venueType`, `location`, `description`, `rules`, `openingTime`, `closingTime`, `slotDurationMinutes`, `maxPlayers`, `isActive`
) VALUES
('fac-badminton-1', 'nmit', 'Badminton Court 1', 'BADMINTON', 'INDOOR', 'Indoor Stadium', 'Championship wooden floor court with professional LED lighting.', 'Non-marking badminton shoes mandatory. Bring your own racquets and shuttlecocks.', '06:00:00', '22:00:00', 60, 4, 1),
('fac-basketball-1', 'nmit', 'Main Basketball Arena', 'BASKETBALL', 'OUTDOOR', 'Main Sports Complex', 'Full-size regulation outdoor basketball court with fiber backboards.', 'Proper sports footwear required. Maximum 10 players for full-court run.', '06:00:00', '21:00:00', 60, 10, 1),
('fac-pickleball-1', 'nmit', 'Pickleball Court 1', 'PICKLEBALL', 'OUTDOOR', 'NMIT Pickleball Courts', 'Dedicated outdoor acrylic pickleball court with night floodlights.', 'Standard pickleball paddles and balls required. Respect slot timing.', '06:00:00', '21:00:00', 60, 4, 1),
('fac-pickleball-2', 'nmit', 'Pickleball Court 2', 'PICKLEBALL', 'OUTDOOR', 'NMIT Pickleball Courts', 'Dedicated outdoor acrylic pickleball court with tournament netting.', 'Standard pickleball paddles and balls required. Respect slot timing.', '06:00:00', '21:00:00', 60, 4, 1),
('fac-table-tennis-1', 'nmit', 'Table Tennis Arena 1', 'TABLE_TENNIS', 'INDOOR', 'Indoor Stadium', 'ITTF approved tournament table with anti-glare overhead lighting.', 'Clean indoor shoes only. Bring your own paddles and 3-star balls.', '06:00:00', '22:00:00', 60, 4, 1);
