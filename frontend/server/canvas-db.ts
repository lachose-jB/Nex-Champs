import { eq, and, gte, lte, desc } from "drizzle-orm";
import { canvasOperations, InsertCanvasOperation } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Save a canvas operation to the database
 */
export async function saveCanvasOperation(
  operation: InsertCanvasOperation
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save canvas operation: database not available");
    return;
  }

  try {
    await db.insert(canvasOperations).values(operation);
  } catch (error) {
    console.error("[Database] Failed to save canvas operation:", error);
    throw error;
  }
}

/**
 * Get all canvas operations for a meeting
 */
export async function getCanvasOperations(meetingId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get canvas operations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(canvasOperations)
      .where(eq(canvasOperations.meetingId, meetingId))
      .orderBy(canvasOperations.sequenceNumber);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get canvas operations:", error);
    throw error;
  }
}

/**
 * Get canvas operations since a specific timestamp
 */
export async function getCanvasOperationsSince(
  meetingId: number,
  timestamp: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get canvas operations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(canvasOperations)
      .where(
        and(
          eq(canvasOperations.meetingId, meetingId),
          gte(canvasOperations.timestamp, timestamp)
        )
      )
      .orderBy(canvasOperations.sequenceNumber);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get canvas operations since timestamp:", error);
    throw error;
  }
}

/**
 * Get canvas operations for a specific participant
 */
export async function getCanvasOperationsByParticipant(
  meetingId: number,
  participantId: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get canvas operations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(canvasOperations)
      .where(
        and(
          eq(canvasOperations.meetingId, meetingId),
          eq(canvasOperations.participantId, participantId)
        )
      )
      .orderBy(canvasOperations.sequenceNumber);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get canvas operations by participant:", error);
    throw error;
  }
}

/**
 * Get canvas operations within a time range
 */
export async function getCanvasOperationsInRange(
  meetingId: number,
  startTime: number,
  endTime: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get canvas operations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(canvasOperations)
      .where(
        and(
          eq(canvasOperations.meetingId, meetingId),
          gte(canvasOperations.timestamp, startTime),
          lte(canvasOperations.timestamp, endTime)
        )
      )
      .orderBy(canvasOperations.sequenceNumber);

    return result;
  } catch (error) {
    console.error("[Database] Failed to get canvas operations in range:", error);
    throw error;
  }
}

/**
 * Get the latest sequence number for a meeting
 */
export async function getLatestSequenceNumber(meetingId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get latest sequence number: database not available");
    return 0;
  }

  try {
    const result = await db
      .select()
      .from(canvasOperations)
      .where(eq(canvasOperations.meetingId, meetingId))
      .orderBy(desc(canvasOperations.sequenceNumber))
      .limit(1);

    return result.length > 0 ? result[0].sequenceNumber : 0;
  } catch (error) {
    console.error("[Database] Failed to get latest sequence number:", error);
    throw error;
  }
}

/**
 * Delete canvas operations for a meeting (useful for cleanup)
 */
export async function deleteCanvasOperations(meetingId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete canvas operations: database not available");
    return;
  }

  try {
    await db.delete(canvasOperations).where(eq(canvasOperations.meetingId, meetingId));
  } catch (error) {
    console.error("[Database] Failed to delete canvas operations:", error);
    throw error;
  }
}

/**
 * Export canvas operations as JSON for audit
 */
export async function exportCanvasOperationsAsJSON(meetingId: number): Promise<string> {
  const operations = await getCanvasOperations(meetingId);

  const exportData = {
    meetingId,
    exportedAt: new Date().toISOString(),
    totalOperations: operations.length,
    operations: operations.map((op) => ({
      id: op.id,
      operationType: op.operationType,
      participantId: op.participantId,
      timestamp: op.timestamp,
      sequenceNumber: op.sequenceNumber,
      version: op.version,
      operationData: op.operationData,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}
