CREATE TABLE `question_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`topicId` int NOT NULL,
	`status` enum('unanswered','correct','incorrect') NOT NULL DEFAULT 'unanswered',
	`attemptCount` int NOT NULL DEFAULT 0,
	`lastAttemptAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_question` UNIQUE(`userId`,`questionId`)
);
--> statement-breakpoint
CREATE INDEX `idx_user_topic_status` ON `question_progress` (`userId`,`topicId`,`status`);