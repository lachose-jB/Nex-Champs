import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  decimal,
  bigint,
  index,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meetings table - represents a single meeting session
 */
export const meetings = mysqlTable(
  "meetings",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    createdBy: int("createdBy").notNull(), // Foreign key to users
    status: mysqlEnum("status", ["draft", "scheduled", "active", "completed", "archived"])
      .default("draft")
      .notNull(),
    currentPhase: mysqlEnum("currentPhase", ["ideation", "clarification", "decision", "feedback", "none"])
      .default("none")
      .notNull(),
    scheduledAt: timestamp("scheduledAt"),
    startedAt: timestamp("startedAt"),
    endedAt: timestamp("endedAt"),
    recordingUrl: varchar("recordingUrl", { length: 512 }),
    auditJsonUrl: varchar("auditJsonUrl", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    createdByIdx: index("createdByIdx").on(table.createdBy),
    statusIdx: index("statusIdx").on(table.status),
  })
);

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Participants table - maps users to meetings with their roles
 */
export const participants = mysqlTable(
  "participants",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    userId: int("userId").notNull(), // Foreign key to users
    displayName: varchar("displayName", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["proposer", "questioner", "clarifier", "decider", "observer"])
      .default("observer")
      .notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    leftAt: timestamp("leftAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    userIdIdx: index("userIdIdx").on(table.userId),
  })
);

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

/**
 * Token Events table - tracks all Token assignments, passes, and expirations
 * Critical for auditability: every Token event is timestamped to millisecond precision
 */
export const tokenEvents = mysqlTable(
  "tokenEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    participantId: int("participantId").notNull(), // Foreign key to participants
    eventType: mysqlEnum("eventType", ["assigned", "passed", "expired", "released"])
      .notNull(),
    duration: int("duration"), // Duration in milliseconds if applicable
    timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
    sequenceNumber: int("sequenceNumber").notNull(), // For ordering events within a meeting
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    participantIdIdx: index("participantIdIdx").on(table.participantId),
    timestampIdx: index("timestampIdx").on(table.timestamp),
  })
);

export type TokenEvent = typeof tokenEvents.$inferSelect;
export type InsertTokenEvent = typeof tokenEvents.$inferInsert;

/**
 * Phase Events table - tracks transitions between the 4 phases
 */
export const phaseEvents = mysqlTable(
  "phaseEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    phase: mysqlEnum("phase", ["ideation", "clarification", "decision", "feedback"])
      .notNull(),
    startedAt: bigint("startedAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
    endedAt: bigint("endedAt", { mode: "number" }), // Unix timestamp in milliseconds
    sequenceNumber: int("sequenceNumber").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
  })
);

export type PhaseEvent = typeof phaseEvents.$inferSelect;
export type InsertPhaseEvent = typeof phaseEvents.$inferInsert;

/**
 * Annotations table - stores Canvas annotations with complete traceability
 * Each annotation is linked to the active Token event (Speak = Act equivalence)
 */
export const annotations = mysqlTable(
  "annotations",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    tokenEventId: int("tokenEventId").notNull(), // Foreign key to tokenEvents
    participantId: int("participantId").notNull(), // Foreign key to participants
    annotationType: mysqlEnum("annotationType", ["text", "drawing", "shape", "highlight", "arrow"])
      .notNull(),
    content: json("content").notNull(), // JSON: {type, coordinates, color, text, etc}
    timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
    sequenceNumber: int("sequenceNumber").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    tokenEventIdIdx: index("tokenEventIdIdx").on(table.tokenEventId),
    participantIdIdx: index("participantIdIdx").on(table.participantId),
  })
);

export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = typeof annotations.$inferInsert;

/**
 * Decisions table - records formal decisions made during the Decision phase
 */
export const decisions = mysqlTable(
  "decisions",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    phaseEventId: int("phaseEventId").notNull(), // Foreign key to phaseEvents (Decision phase)
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    options: json("options").notNull(), // JSON array of options voted on
    votingMethod: mysqlEnum("votingMethod", ["consensus", "majority", "unanimous", "decider"])
      .notNull(),
    result: text("result").notNull(), // The chosen option or outcome
    timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
  })
);

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = typeof decisions.$inferInsert;

/**
 * Feedback table - stores feedback from the Feedback phase
 */
export const feedback = mysqlTable(
  "feedback",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    participantId: int("participantId").notNull(), // Foreign key to participants
    feedbackType: mysqlEnum("feedbackType", ["process", "decision", "equity", "other"])
      .notNull(),
    content: text("content").notNull(),
    sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    participantIdIdx: index("participantIdIdx").on(table.participantId),
  })
);

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

/**
 * Interaction Statistics table - pre-computed equity metrics for quick retrieval
 */
export const interactionStatistics = mysqlTable(
  "interactionStatistics",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(), // Foreign key to meetings
    participantId: int("participantId").notNull(), // Foreign key to participants
    totalSpeakingTime: int("totalSpeakingTime").default(0).notNull(), // in milliseconds
    numberOfAnnotations: int("numberOfAnnotations").default(0).notNull(),
    numberOfTokenPasses: int("numberOfTokenPasses").default(0).notNull(),
    timeInIdeation: int("timeInIdeation").default(0).notNull(), // in milliseconds
    timeInClarification: int("timeInClarification").default(0).notNull(),
    timeInDecision: int("timeInDecision").default(0).notNull(),
    timeInFeedback: int("timeInFeedback").default(0).notNull(),
    lastUpdated: bigint("lastUpdated", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    participantIdIdx: index("participantIdIdx").on(table.participantId),
  })
);

export type InteractionStatistics = typeof interactionStatistics.$inferSelect;
export type InsertInteractionStatistics = typeof interactionStatistics.$inferInsert;

/**
 * Meeting Metadata table - stores JSON audit data and configuration
 */
export const meetingMetadata = mysqlTable(
  "meetingMetadata",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull().unique(), // Foreign key to meetings
    config: json("config").notNull(), // Meeting configuration: phase durations, token timeout, etc
    auditLog: json("auditLog").notNull(), // Complete audit trail in JSON format
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
  })
);

export type MeetingMetadata = typeof meetingMetadata.$inferSelect;
export type InsertMeetingMetadata = typeof meetingMetadata.$inferInsert;

/**
 * Canvas Operations table - stores all Canvas drawing operations for real-time sync and audit
 */
export const canvasOperations = mysqlTable(
  "canvasOperations",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meetingId").notNull(),
    participantId: int("participantId").notNull(),
    operationType: mysqlEnum("operationType", ["draw", "erase", "text", "clear", "shape"])
      .notNull(),
    operationData: json("operationData").notNull(),
    version: int("version").notNull(),
    operationId: varchar("operationId", { length: 255 }).notNull().unique(),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    sequenceNumber: int("sequenceNumber").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    participantIdIdx: index("participantIdIdx").on(table.participantId),
    timestampIdx: index("timestampIdx").on(table.timestamp),
    operationIdIdx: index("operationIdIdx").on(table.operationId),
  })
);

export type CanvasOperation = typeof canvasOperations.$inferSelect;
export type InsertCanvasOperation = typeof canvasOperations.$inferInsert;

/**
 * Audit Logs table - tracks all security-relevant actions
 */
export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"), // Foreign key to users (nullable for system events)
    action: varchar("action", { length: 100 }).notNull(), // e.g., "login", "tokenAssigned", "dataAccessed"
    resource: varchar("resource", { length: 100 }), // e.g., "meeting", "annotation", "recording"
    resourceId: int("resourceId"), // ID of the affected resource
    details: json("details"), // Additional context
    ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
    userAgent: text("userAgent"), // Browser/client info
    status: mysqlEnum("status", ["success", "failure", "warning"]).notNull(),
    severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low"),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    actionIdx: index("actionIdx").on(table.action),
    timestampIdx: index("timestampIdx").on(table.timestamp),
    resourceIdx: index("resourceIdx").on(table.resource),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Security Events table - tracks suspicious activities and security incidents
 */
export const securityEvents = mysqlTable(
  "securityEvents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"), // Foreign key to users
    eventType: mysqlEnum("eventType", [
      "failed_login",
      "account_locked",
      "suspicious_activity",
      "data_access_denied",
      "rate_limit_exceeded",
      "invalid_token",
      "unauthorized_access",
      "data_breach_attempt",
    ]).notNull(),
    description: text("description"),
    ipAddress: varchar("ipAddress", { length: 45 }),
    resolved: boolean("resolved").default(false),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy"), // Admin who resolved it
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    eventTypeIdx: index("eventTypeIdx").on(table.eventType),
    timestampIdx: index("timestampIdx").on(table.timestamp),
  })
);

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

/**
 * Data Access Logs table - tracks access to sensitive data
 */
export const dataAccessLogs = mysqlTable(
  "dataAccessLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Foreign key to users
    dataType: varchar("dataType", { length: 100 }).notNull(), // e.g., "recording", "annotation", "decision"
    resourceId: int("resourceId").notNull(),
    meetingId: int("meetingId"),
    action: mysqlEnum("action", ["view", "download", "export", "delete"]).notNull(),
    ipAddress: varchar("ipAddress", { length: 45 }),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    dataTypeIdx: index("dataTypeIdx").on(table.dataType),
    meetingIdIdx: index("meetingIdIdx").on(table.meetingId),
    timestampIdx: index("timestampIdx").on(table.timestamp),
  })
);

export type DataAccessLog = typeof dataAccessLogs.$inferSelect;
export type InsertDataAccessLog = typeof dataAccessLogs.$inferInsert;

/**
 * User Sessions table - tracks active sessions for security
 */
export const userSessions = mysqlTable(
  "userSessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Foreign key to users
    sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
    refreshToken: varchar("refreshToken", { length: 255 }).unique(),
    ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
    userAgent: text("userAgent"),
    deviceId: varchar("deviceId", { length: 255 }),
    isActive: boolean("isActive").default(true),
    loginAt: timestamp("loginAt").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    lastActivityAt: timestamp("lastActivityAt").notNull(),
    logoutAt: timestamp("logoutAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    sessionTokenIdx: index("sessionTokenIdx").on(table.sessionToken),
    expiresAtIdx: index("expiresAtIdx").on(table.expiresAt),
  })
);

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Encryption Keys table - manages encryption key rotation
 */
export const encryptionKeys = mysqlTable(
  "encryptionKeys",
  {
    id: int("id").autoincrement().primaryKey(),
    keyId: varchar("keyId", { length: 255 }).notNull().unique(),
    algorithm: varchar("algorithm", { length: 50 }).notNull(), // e.g., "AES-256-GCM"
    keyHash: varchar("keyHash", { length: 255 }).notNull(), // Hash of the key for verification
    isActive: boolean("isActive").default(true),
    rotatedAt: timestamp("rotatedAt"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    keyIdIdx: index("keyIdIdx").on(table.keyId),
    isActiveIdx: index("isActiveIdx").on(table.isActive),
  })
);

export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type InsertEncryptionKey = typeof encryptionKeys.$inferInsert;

/**
 * GDPR Requests table - tracks data deletion and export requests
 */
export const gdprRequests = mysqlTable(
  "gdprRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Foreign key to users
    requestType: mysqlEnum("requestType", ["data_export", "data_deletion", "anonymization"]).notNull(),
    status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending"),
    reason: text("reason"),
    dataUrl: varchar("dataUrl", { length: 500 }), // URL to download exported data
    completedAt: timestamp("completedAt"),
    expiresAt: timestamp("expiresAt"), // Data export link expiration
    requestedAt: timestamp("requestedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    statusIdx: index("statusIdx").on(table.status),
    requestTypeIdx: index("requestTypeIdx").on(table.requestType),
  })
);

export type GDPRRequest = typeof gdprRequests.$inferSelect;
export type InsertGDPRRequest = typeof gdprRequests.$inferInsert;
