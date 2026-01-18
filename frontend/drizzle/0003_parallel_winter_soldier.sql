CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`resource` varchar(100),
	`resourceId` int,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure','warning') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'low',
	`timestamp` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataAccessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dataType` varchar(100) NOT NULL,
	`resourceId` int NOT NULL,
	`meetingId` int,
	`action` enum('view','download','export','delete') NOT NULL,
	`ipAddress` varchar(45),
	`timestamp` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataAccessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `encryptionKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyId` varchar(255) NOT NULL,
	`algorithm` varchar(50) NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`isActive` boolean DEFAULT true,
	`rotatedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encryptionKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `encryptionKeys_keyId_unique` UNIQUE(`keyId`)
);
--> statement-breakpoint
CREATE TABLE `gdprRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requestType` enum('data_export','data_deletion','anonymization') NOT NULL,
	`status` enum('pending','processing','completed','rejected') DEFAULT 'pending',
	`reason` text,
	`dataUrl` varchar(500),
	`completedAt` timestamp,
	`expiresAt` timestamp,
	`requestedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gdprRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `securityEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('failed_login','account_locked','suspicious_activity','data_access_denied','rate_limit_exceeded','invalid_token','unauthorized_access','data_breach_attempt') NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`resolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`timestamp` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `securityEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`refreshToken` varchar(255),
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`deviceId` varchar(255),
	`isActive` boolean DEFAULT true,
	`loginAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastActivityAt` timestamp NOT NULL,
	`logoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSessions_sessionToken_unique` UNIQUE(`sessionToken`),
	CONSTRAINT `userSessions_refreshToken_unique` UNIQUE(`refreshToken`)
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `actionIdx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `auditLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `resourceIdx` ON `auditLogs` (`resource`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `dataAccessLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `dataTypeIdx` ON `dataAccessLogs` (`dataType`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `dataAccessLogs` (`meetingId`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `dataAccessLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `keyIdIdx` ON `encryptionKeys` (`keyId`);--> statement-breakpoint
CREATE INDEX `isActiveIdx` ON `encryptionKeys` (`isActive`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `gdprRequests` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `gdprRequests` (`status`);--> statement-breakpoint
CREATE INDEX `requestTypeIdx` ON `gdprRequests` (`requestType`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `securityEvents` (`userId`);--> statement-breakpoint
CREATE INDEX `eventTypeIdx` ON `securityEvents` (`eventType`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `securityEvents` (`timestamp`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `userSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `sessionTokenIdx` ON `userSessions` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `expiresAtIdx` ON `userSessions` (`expiresAt`);