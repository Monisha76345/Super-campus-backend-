-- Migration to add 'In Progress' and 'Completed' to projects stage enum

ALTER TABLE `projects` 
  MODIFY COLUMN `stage` ENUM('Idea','Planning','Prototype','In Progress','Completed') NOT NULL DEFAULT 'Idea';
