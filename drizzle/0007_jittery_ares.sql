DROP INDEX `idx_user_topic_status` ON `question_progress`;--> statement-breakpoint
ALTER TABLE `question_progress` ADD `firstAttemptStatus` enum('unanswered','correct','incorrect') DEFAULT 'unanswered' NOT NULL;--> statement-breakpoint
ALTER TABLE `question_progress` ADD `lastAttemptCorrect` boolean;--> statement-breakpoint
CREATE INDEX `idx_user_topic_first_attempt` ON `question_progress` (`userId`,`topicId`,`firstAttemptStatus`);