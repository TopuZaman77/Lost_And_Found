CREATE TABLE `claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`claimantId` int NOT NULL,
	`uniqueIdentifiers` text NOT NULL,
	`proofDescription` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`reviewNote` text,
	`createdAt` bigint NOT NULL,
	`reviewedAt` bigint,
	CONSTRAINT `claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `claims_item_claimant_unique` UNIQUE(`itemId`,`claimantId`)
);
--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`status` enum('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
	`providerId` varchar(180),
	`failureReason` text,
	`createdAt` bigint NOT NULL,
	`sentAt` bigint,
	CONSTRAINT `email_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `item_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lostItemId` int NOT NULL,
	`foundItemId` int NOT NULL,
	`matchScore` int NOT NULL,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `item_matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `item_matches_pair_unique` UNIQUE(`lostItemId`,`foundItemId`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`reportType` enum('lost','found') NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`category` enum('Electronics','Documents','Accessories','Clothing','Bags','Books','Keys','Cards','Other') NOT NULL,
	`eventDate` bigint NOT NULL,
	`location` varchar(220) NOT NULL,
	`holdingLocation` varchar(220),
	`contactDetails` varchar(320) NOT NULL,
	`imageKey` varchar(512),
	`imageUrl` varchar(768),
	`status` enum('Lost','Claimed','Verified','Returned') NOT NULL DEFAULT 'Lost',
	`adminNote` text,
	`returnedAt` bigint,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('item_match','claim_submitted','claim_approved','claim_rejected') NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`itemId` int,
	`claimId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studentId` varchar(32) NOT NULL,
	`department` varchar(120) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`affiliation` enum('student','staff') NOT NULL DEFAULT 'student',
	`contactInfo` varchar(320) NOT NULL,
	`profileCompleted` boolean NOT NULL DEFAULT true,
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_unique` UNIQUE(`userId`),
	CONSTRAINT `profiles_student_id_unique` UNIQUE(`studentId`)
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`fromStatus` enum('Lost','Claimed','Verified','Returned'),
	`toStatus` enum('Lost','Claimed','Verified','Returned') NOT NULL,
	`actorId` int NOT NULL,
	`note` text,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `claims_item_status_idx` ON `claims` (`itemId`,`status`);--> statement-breakpoint
CREATE INDEX `claims_claimant_idx` ON `claims` (`claimantId`);--> statement-breakpoint
CREATE INDEX `claims_status_idx` ON `claims` (`status`);--> statement-breakpoint
CREATE INDEX `email_delivery_notification_idx` ON `email_deliveries` (`notificationId`);--> statement-breakpoint
CREATE INDEX `email_delivery_status_idx` ON `email_deliveries` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `item_matches_lost_idx` ON `item_matches` (`lostItemId`);--> statement-breakpoint
CREATE INDEX `item_matches_found_idx` ON `item_matches` (`foundItemId`);--> statement-breakpoint
CREATE INDEX `items_reporter_idx` ON `items` (`reporterId`);--> statement-breakpoint
CREATE INDEX `items_type_status_idx` ON `items` (`reportType`,`status`);--> statement-breakpoint
CREATE INDEX `items_category_idx` ON `items` (`category`);--> statement-breakpoint
CREATE INDEX `items_event_date_idx` ON `items` (`eventDate`);--> statement-breakpoint
CREATE INDEX `items_created_at_idx` ON `items` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`isRead`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_item_idx` ON `notifications` (`itemId`);--> statement-breakpoint
CREATE INDEX `profiles_affiliation_idx` ON `profiles` (`affiliation`);--> statement-breakpoint
CREATE INDEX `status_history_item_idx` ON `status_history` (`itemId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);