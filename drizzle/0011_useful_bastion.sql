CREATE TABLE `security_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`companyId` int,
	`action` varchar(100) NOT NULL,
	`metadata` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_logs_id` PRIMARY KEY(`id`)
);
