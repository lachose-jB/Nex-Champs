import { getDb } from "./db";
import { auditLogs, securityEvents, dataAccessLogs, userSessions } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";

/**
 * Security Module - Handles audit logging, security events, and data access tracking
 */

export interface AuditLogEntry {
  userId?: number;
  action: string;
  resource?: string;
  resourceId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure" | "warning";
  severity?: "low" | "medium" | "high" | "critical";
  timestamp: number;
}

export interface SecurityEventEntry {
  userId?: number;
  eventType:
    | "failed_login"
    | "account_locked"
    | "suspicious_activity"
    | "data_access_denied"
    | "rate_limit_exceeded"
    | "invalid_token"
    | "unauthorized_access"
    | "data_breach_attempt";
  description?: string;
  ipAddress?: string;
  timestamp: number;
}

export interface DataAccessEntry {
  userId: number;
  dataType: string;
  resourceId: number;
  meetingId?: number;
  action: "view" | "download" | "export" | "delete";
  ipAddress?: string;
  timestamp: number;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Database not available");
    return;
  }

  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status,
      severity: entry.severity || "low",
      timestamp: entry.timestamp,
    });
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error);
  }
}

/**
 * Log a security event
 */
export async function logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Security] Database not available");
    return;
  }

  try {
    await db.insert(securityEvents).values({
      userId: entry.userId,
      eventType: entry.eventType,
      description: entry.description,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp,
    });
  } catch (error) {
    console.error("[Security] Failed to log security event:", error);
  }
}

/**
 * Log data access
 */
export async function logDataAccess(entry: DataAccessEntry): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[DataAccess] Database not available");
    return;
  }

  try {
    await db.insert(dataAccessLogs).values({
      userId: entry.userId,
      dataType: entry.dataType,
      resourceId: entry.resourceId,
      meetingId: entry.meetingId,
      action: entry.action,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp,
    });
  } catch (error) {
    console.error("[DataAccess] Failed to log data access:", error);
  }
}

/**
 * Create a user session
 */
export async function createUserSession(
  userId: number,
  sessionToken: string,
  refreshToken: string,
  ipAddress: string,
  userAgent?: string,
  deviceId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Session] Database not available");
    return;
  }

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(userSessions).values({
      userId,
      sessionToken,
      refreshToken,
      ipAddress,
      userAgent,
      deviceId,
      isActive: true,
      loginAt: now,
      expiresAt,
      lastActivityAt: now,
    });
  } catch (error) {
    console.error("[Session] Failed to create user session:", error);
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Session] Database not available");
    return;
  }

  try {
    await db
      .update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
  } catch (error) {
    console.error("[Session] Failed to update session activity:", error);
  }
}

/**
 * Invalidate a user session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Session] Database not available");
    return;
  }

  try {
    await db
      .update(userSessions)
      .set({ isActive: false, logoutAt: new Date() })
      .where(eq(userSessions.sessionToken, sessionToken));
  } catch (error) {
    console.error("[Session] Failed to invalidate session:", error);
  }
}

/**
 * Get active sessions for a user
 */
export async function getActiveSessions(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Session] Database not available");
    return [];
  }

  try {
    const now = new Date();
    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(eq(userSessions.userId, userId), eq(userSessions.isActive, true), gte(userSessions.expiresAt, now))
      );

    return sessions;
  } catch (error) {
    console.error("[Session] Failed to get active sessions:", error);
    return [];
  }
}

/**
 * Get audit logs for a resource
 */
export async function getAuditLogs(resource: string, resourceId?: number, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Audit] Database not available");
    return [];
  }

  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        resourceId
          ? and(eq(auditLogs.resource, resource), eq(auditLogs.resourceId, resourceId))
          : eq(auditLogs.resource, resource)
      )
      .orderBy((t) => t.timestamp)
      .limit(limit);

    return logs;
  } catch (error) {
    console.error("[Audit] Failed to get audit logs:", error);
    return [];
  }
}

/**
 * Get security events for a user
 */
export async function getSecurityEvents(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Security] Database not available");
    return [];
  }

  try {
    const events = await db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.userId, userId))
      .orderBy((t) => t.timestamp)
      .limit(limit);

    return events;
  } catch (error) {
    console.error("[Security] Failed to get security events:", error);
    return [];
  }
}
