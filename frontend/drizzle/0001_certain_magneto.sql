CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`tokenEventId` int NOT NULL,
	`participantId` int NOT NULL,
	`annotationType` enum('text','drawing','shape','highlight','arrow') NOT NULL,
	`content` json NOT NULL,
	`timestamp` bigint NOT NULL,
	`sequenceNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`phaseEventId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`options` json NOT NULL,
	`votingMethod` enum('consensus','majority','unanimous','decider') NOT NULL,
	`result` text NOT NULL,
	`timestamp` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`participantId` int NOT NULL,
	`feedbackType` enum('process','decision','equity','other') NOT NULL,
	`content` text NOT NULL,
	`sentiment` enum('positive','neutral','negative'),
	`timestamp` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interactionStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`participantId` int NOT NULL,
	`totalSpeakingTime` int NOT NULL DEFAULT 0,
	`numberOfAnnotations` int NOT NULL DEFAULT 0,
	`numberOfTokenPasses` int NOT NULL DEFAULT 0,
	`timeInIdeation` int NOT NULL DEFAULT 0,
	`timeInClarification` int NOT NULL DEFAULT 0,
	`timeInDecision` int NOT NULL DEFAULT 0,
	`timeInFeedback` int NOT NULL DEFAULT 0,
	`lastUpdated` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interactionStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetingMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`config` json NOT NULL,
	`auditLog` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetingMetadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `meetingMetadata_meetingId_unique` UNIQUE(`meetingId`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`status` enum('draft','scheduled','active','completed','archived') NOT NULL DEFAULT 'draft',
	`currentPhase` enum('ideation','clarification','decision','feedback','none') NOT NULL DEFAULT 'none',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`recordingUrl` varchar(512),
	`auditJsonUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`role` enum('proposer','questioner','clarifier','decider','observer') NOT NULL DEFAULT 'observer',
	`isActive` boolean NOT NULL DEFAULT true,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phaseEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`phase` enum('ideation','clarification','decision','feedback') NOT NULL,
	`startedAt` bigint NOT NULL,
	`endedAt` bigint,
	`sequenceNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phaseEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`participantId` int NOT NULL,
	`eventType` enum('assigned','passed','expired','released') NOT NULL,
	`duration` int,
	`timestamp` bigint NOT NULL,
	`sequenceNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `annotations` (`meetingId`);--> statement-breakpoint
CREATE INDEX `tokenEventIdIdx` ON `annotations` (`tokenEventId`);--> statement-breakpoint
CREATE INDEX `participantIdIdx` ON `annotations` (`participantId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `decisions` (`meetingId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `feedback` (`meetingId`);--> statement-breakpoint
CREATE INDEX `participantIdIdx` ON `feedback` (`participantId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `interactionStatistics` (`meetingId`);--> statement-breakpoint
CREATE INDEX `participantIdIdx` ON `interactionStatistics` (`participantId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `meetingMetadata` (`meetingId`);--> statement-breakpoint
CREATE INDEX `createdByIdx` ON `meetings` (`createdBy`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `meetings` (`status`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `participants` (`meetingId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `participants` (`userId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `phaseEvents` (`meetingId`);--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `tokenEvents` (`meetingId`);--> statement-breakpoint
CREATE INDEX `participantIdIdx` ON `tokenEvents` (`participantId`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `tokenEvents` (`timestamp`);