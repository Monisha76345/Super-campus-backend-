-- Add contactPhone and contactEmail to marketplace_items

ALTER TABLE `marketplace_items`
  ADD COLUMN `contactPhone` varchar(50) NULL AFTER `sellerRole`,
  ADD COLUMN `contactEmail` varchar(255) NULL AFTER `contactPhone`;
