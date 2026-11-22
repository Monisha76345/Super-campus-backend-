-- 022-connect-club-event-fields.sql
-- Add detailed leadership, schedule, venue, contact, members, and Google Forms fields to campus clubs and events

ALTER TABLE `campus_club` ADD COLUMN `lead_name` VARCHAR(255) NULL;
ALTER TABLE `campus_club` ADD COLUMN `meeting_schedule` VARCHAR(255) NULL;
ALTER TABLE `campus_club` ADD COLUMN `room_or_venue` VARCHAR(255) NULL;
ALTER TABLE `campus_club` ADD COLUMN `contact_email` VARCHAR(255) NULL;
ALTER TABLE `campus_club` ADD COLUMN `members_data` JSON NULL;

ALTER TABLE `campus_event` ADD COLUMN `google_forms_url` VARCHAR(500) NULL;
