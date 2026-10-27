-- Add passType to outpass_request for Outpass (same day before 10 PM) vs Leave (multi-day or after 10 PM)

ALTER TABLE `outpass_request`
  ADD COLUMN `passType` enum('OUTPASS','LEAVE') NOT NULL DEFAULT 'OUTPASS' AFTER `parentPhone`;
