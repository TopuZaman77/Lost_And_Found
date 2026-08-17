CREATE TABLE `local_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`studentId` varchar(32) NOT NULL,
	`passwordHash` varchar(512) NOT NULL,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `local_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_credentials_user_unique` UNIQUE(`userId`),
	CONSTRAINT `local_credentials_email_unique` UNIQUE(`email`),
	CONSTRAINT `local_credentials_student_id_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
ALTER TABLE `local_credentials` ADD CONSTRAINT `local_credentials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;