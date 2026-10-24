-- 1. Add WARDEN and SUPER_ADMIN into campus_directory role enum
ALTER TABLE `campus_directory` 
MODIFY COLUMN `role` enum('STUDENT','FACULTY','ALUMNI','WARDEN','SUPER_ADMIN','CAMPUS_ADMIN') NOT NULL;

-- 2. Automatically migrate any existing campus_admin records to SUPER_ADMIN
SET SQL_SAFE_UPDATES = 0;
UPDATE `campus_directory` SET `role` = 'SUPER_ADMIN' WHERE `role` = 'CAMPUS_ADMIN';
SET SQL_SAFE_UPDATES = 1;

