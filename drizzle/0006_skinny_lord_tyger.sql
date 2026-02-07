CREATE TABLE `exam_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`score` int NOT NULL,
	`passed` boolean NOT NULL,
	CONSTRAINT `exam_completions_id` PRIMARY KEY(`id`)
);
