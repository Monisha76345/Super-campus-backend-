-- Chat: Add media support (photos and videos) to chat messages
ALTER TABLE `chat_message` ADD COLUMN `mediaUrl` varchar(500) NULL;
ALTER TABLE `chat_message` ADD COLUMN `mediaType` varchar(20) NULL;
