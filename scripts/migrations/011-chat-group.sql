-- Chat: Add name and photoKey to chat_thread for group conversations

ALTER TABLE `chat_thread`
  ADD COLUMN `name` varchar(255) NULL AFTER `type`;

ALTER TABLE `chat_thread`
  ADD COLUMN `photoKey` varchar(255) NULL AFTER `name`;
