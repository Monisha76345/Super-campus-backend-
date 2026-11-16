-- Add creator metadata columns to projects table
ALTER TABLE `projects` ADD COLUMN `creatorRole` varchar(40) NULL;
ALTER TABLE `projects` ADD COLUMN `creatorDepartment` varchar(100) NULL;
ALTER TABLE `projects` ADD COLUMN `creatorEmployeeId` varchar(50) NULL;
ALTER TABLE `projects` ADD COLUMN `creatorBatch` varchar(30) NULL;

