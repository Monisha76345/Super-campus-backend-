-- 020-club-overview-achievements.sql
-- Add overview and achievements_data columns to campus_club table
ALTER TABLE `campus_club`
ADD COLUMN `overview` TEXT NULL AFTER `description`,
ADD COLUMN `achievements_data` JSON NULL AFTER `members_data`;
