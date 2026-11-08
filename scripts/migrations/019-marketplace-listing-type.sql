-- 019-marketplace-listing-type.sql
-- Add listingType to marketplace_items to cleanly separate Campus Admin Store vs Student Buy & Sell

ALTER TABLE `marketplace_items`
  ADD COLUMN `listingType` varchar(32) NOT NULL DEFAULT 'BUY_SELL' AFTER `sellerRole`,
  ADD KEY `idx_marketplace_listing_type` (`listingType`);

-- Update any existing campus admin / official store items to CAMPUS_STORE
UPDATE `marketplace_items`
SET `listingType` = 'CAMPUS_STORE'
WHERE `sellerRole` IN ('CAMPUS_ADMIN', 'ADMIN', 'admin', 'campus_admin')
   OR `title` LIKE '%Official%'
   OR `title` LIKE '%Campus%';

