import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  meetings,
  participants,
  tokenEvents,
  annotations,
  phaseEvents,
  interactionStatistics,
  InsertInteractionStatistics,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Meeting queries
 */
export async function createMeeting(
  title: string,
  description: string | undefined,
  createdBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(meetings).values({
    title,
    description,
    createdBy,
    status: "draft",
    currentPhase: "none",
  });

  return result;
}

export async function getMeetingById(meetingId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateMeetingPhase(meetingId: number, phase: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(meetings)
    .set({ currentPhase: phase as any })
    .where(eq(meetings.id, meetingId));
}

/**
 * Participant queries
 */
export async function addParticipant(
  meetingId: number,
  userId: number,
  displayName: string,
  role: string = "observer"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(participants).values({
    meetingId,
    userId,
    displayName,
    role: role as any,
    isActive: true,
  });

  return result;
}

export async function getMeetingParticipants(meetingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(participants)
    .where(eq(participants.meetingId, meetingId));
}

/**
 * Token Event queries
 */
export async function recordTokenEvent(
  meetingId: number,
  participantId: number,
  eventType: string,
  duration?: number,
  sequenceNumber?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timestamp = Date.now();
  const result = await db.insert(tokenEvents).values({
    meetingId,
    participantId,
    eventType: eventType as any,
    duration,
    timestamp,
    sequenceNumber: sequenceNumber || 0,
  });

  return result;
}

export async function getTokenEventsByMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tokenEvents)
    .where(eq(tokenEvents.meetingId, meetingId))
    .orderBy(tokenEvents.sequenceNumber);
}

/**
 * Annotation queries
 */
export async function recordAnnotation(
  meetingId: number,
  tokenEventId: number,
  participantId: number,
  annotationType: string,
  content: any,
  sequenceNumber?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timestamp = Date.now();
  const result = await db.insert(annotations).values({
    meetingId,
    tokenEventId,
    participantId,
    annotationType: annotationType as any,
    content,
    timestamp,
    sequenceNumber: sequenceNumber || 0,
  });

  return result;
}

export async function getAnnotationsByMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(annotations)
    .where(eq(annotations.meetingId, meetingId))
    .orderBy(annotations.sequenceNumber);
}

/**
 * Phase Event queries
 */
export async function recordPhaseEvent(
  meetingId: number,
  phase: string,
  sequenceNumber?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startedAt = Date.now();
  const result = await db.insert(phaseEvents).values({
    meetingId,
    phase: phase as any,
    startedAt,
    sequenceNumber: sequenceNumber || 0,
  });

  return result;
}

export async function endPhaseEvent(phaseEventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const endedAt = Date.now();
  await db
    .update(phaseEvents)
    .set({ endedAt })
    .where(eq(phaseEvents.id, phaseEventId));
}

/**
 * Statistics queries
 */
export async function getInteractionStatistics(meetingId: number, participantId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(interactionStatistics)
    .where(
      and(
        eq(interactionStatistics.meetingId, meetingId),
        eq(interactionStatistics.participantId, participantId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateInteractionStatistics(
  meetingId: number,
  participantId: number,
  updates: Partial<InsertInteractionStatistics>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getInteractionStatistics(meetingId, participantId);

  if (existing) {
    await db
      .update(interactionStatistics)
      .set({ ...updates, lastUpdated: Date.now() })
      .where(
        and(
          eq(interactionStatistics.meetingId, meetingId),
          eq(interactionStatistics.participantId, participantId)
        )
      );
  } else {
    await db.insert(interactionStatistics).values({
      meetingId,
      participantId,
      ...updates,
      lastUpdated: Date.now(),
    });
  }
}

// TODO: add additional feature queries here as your schema grows.
