-- Migration 015: Add theme column to user table for storing per-user theme preference in database
ALTER TABLE `user`
  ADD COLUMN `theme` varchar(20) NOT NULL DEFAULT 'dark' AFTER `status`;
