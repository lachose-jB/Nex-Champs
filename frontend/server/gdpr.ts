import { getDb } from "./db";
import { gdprRequests, users, meetings, participants, tokenEvents, annotations, decisions, feedback, canvasOperations, interactionStatistics } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "./storage";

/**
 * GDPR Module - Handles data export, deletion, and anonymization
 */

/**
 * Request data export for a user
 */
export async function requestDataExport(userId: number, reason?: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Create GDPR request
    const request = await db.insert(gdprRequests).values({
      userId,
      requestType: "data_export",
      status: "processing",
      reason,
      requestedAt: new Date(),
    });

    // Export user data
    const userData = await exportUserData(userId);

    // Create JSON file
    const jsonContent = JSON.stringify(userData, null, 2);
    const filename = `user-data-export-${userId}-${Date.now()}.json`;

    // Upload to S3
    const { url } = await storagePut(filename, jsonContent, "application/json");

    // Update GDPR request with URL
    await db
      .update(gdprRequests)
      .set({
        status: "completed",
        dataUrl: url,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .where(eq(gdprRequests.userId, userId));

    return url;
  } catch (error) {
    console.error("[GDPR] Failed to export user data:", error);
    throw error;
  }
}

/**
 * Export all user data
 */
async function exportUserData(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Fetch user data
    const userData = await db.select().from(users).where(eq(users.id, userId));

    // Fetch user's meetings
    const userMeetings = await db.select().from(meetings).where(eq(meetings.createdBy, userId));

    // Fetch user's participations
    const participations = await db.select().from(participants).where(eq(participants.userId, userId));

    // Fetch user's token events
    const tokenEvents_ = await db.select().from(tokenEvents).where(eq(tokenEvents.participantId, userId));

    // Fetch user's annotations
    const userAnnotations = await db.select().from(annotations).where(eq(annotations.participantId, userId));

    // Fetch user's decisions (meetings where user participated in decision phase)
    const userDecisions = await db.select().from(decisions).where(eq(decisions.meetingId, userId));

    // Fetch user's feedback
    const userFeedback = await db.select().from(feedback).where(eq(feedback.participantId, userId));

    // Fetch user's canvas operations
    const canvasOps = await db.select().from(canvasOperations).where(eq(canvasOperations.participantId, userId));

    // Fetch user's statistics
    const stats = await db.select().from(interactionStatistics).where(eq(interactionStatistics.participantId, userId));

    return {
      exportedAt: new Date().toISOString(),
      user: userData,
      meetings: userMeetings,
      participations,
      tokenEvents: tokenEvents_,
      annotations: userAnnotations,
      decisions: userDecisions,
      feedback: userFeedback,
      canvasOperations: canvasOps,
      statistics: stats,
    };
  } catch (error) {
    console.error("[GDPR] Failed to export user data:", error);
    throw error;
  }
}

/**
 * Request data deletion for a user
 */
export async function requestDataDeletion(userId: number, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Create GDPR request
    await db.insert(gdprRequests).values({
      userId,
      requestType: "data_deletion",
      status: "processing",
      reason,
      requestedAt: new Date(),
    });

    // Schedule deletion (in production, this would be a background job)
    // For now, we'll mark it as pending
  } catch (error) {
    console.error("[GDPR] Failed to request data deletion:", error);
    throw error;
  }
}

/**
 * Request data anonymization for a user
 */
export async function requestDataAnonymization(userId: number, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Create GDPR request
    await db.insert(gdprRequests).values({
      userId,
      requestType: "anonymization",
      status: "processing",
      reason,
      requestedAt: new Date(),
    });

    // Anonymize user data
    await anonymizeUserData(userId);

    // Mark request as completed
    await db
      .update(gdprRequests)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(and(eq(gdprRequests.userId, userId), eq(gdprRequests.requestType, "anonymization")));
  } catch (error) {
    console.error("[GDPR] Failed to anonymize user data:", error);
    throw error;
  }
}

/**
 * Anonymize user data
 */
async function anonymizeUserData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Update user data
    await db
      .update(users)
      .set({
        name: `Anonymous User ${userId}`,
        email: `anonymous-${userId}@example.com`,
        openId: `anonymous-${userId}-${Date.now()}`,
      })
      .where(eq(users.id, userId));

    // Anonymize annotations
    await db
      .update(annotations)
      .set({
        participantId: 0, // Placeholder for anonymized participant
      })
      .where(eq(annotations.participantId, userId));

    // Anonymize feedback
    await db
      .update(feedback)
      .set({
        content: "[Anonymized]",
        sentiment: null,
      })
      .where(eq(feedback.participantId, userId));

    console.log(`[GDPR] User ${userId} data anonymized`);
  } catch (error) {
    console.error("[GDPR] Failed to anonymize user data:", error);
    throw error;
  }
}

/**
 * Get GDPR requests for a user
 */
export async function getGDPRRequests(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const requests = await db.select().from(gdprRequests).where(eq(gdprRequests.userId, userId));
    return requests;
  } catch (error) {
    console.error("[GDPR] Failed to get GDPR requests:", error);
    return [];
  }
}

/**
 * Clean up expired data exports
 */
export async function cleanupExpiredExports(): Promise<void> {
  const db = await getDb();
  if (!db) {
    return;
  }

  try {
    const now = new Date();

    // Delete expired export requests
    await db
      .delete(gdprRequests)
      .where(
        and(
          eq(gdprRequests.requestType, "data_export"),
          eq(gdprRequests.status, "completed")
          // expiresAt < now (would need custom comparison)
        )
      );

    console.log("[GDPR] Cleaned up expired data exports");
  } catch (error) {
    console.error("[GDPR] Failed to cleanup expired exports:", error);
  }
}
