-- Add parent contact details to outpass requests for automated SMS alerts on gate exit and entry

ALTER TABLE `outpass_request`
  ADD COLUMN `parentPhone` varchar(25) NULL AFTER `roomNumber`;
