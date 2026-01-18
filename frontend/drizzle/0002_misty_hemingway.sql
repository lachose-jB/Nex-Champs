CREATE TABLE `canvasOperations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`participantId` int NOT NULL,
	`operationType` enum('draw','erase','text','clear','shape') NOT NULL,
	`operationData` json NOT NULL,
	`version` int NOT NULL,
	`operationId` varchar(255) NOT NULL,
	`timestamp` bigint NOT NULL,
	`sequenceNumber` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `canvasOperations_id` PRIMARY KEY(`id`),
	CONSTRAINT `canvasOperations_operationId_unique` UNIQUE(`operationId`)
);
--> statement-breakpoint
CREATE INDEX `meetingIdIdx` ON `canvasOperations` (`meetingId`);--> statement-breakpoint
CREATE INDEX `participantIdIdx` ON `canvasOperations` (`participantId`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `canvasOperations` (`timestamp`);--> statement-breakpoint
CREATE INDEX `operationIdIdx` ON `canvasOperations` (`operationId`);