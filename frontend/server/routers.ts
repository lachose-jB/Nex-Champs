import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createMeeting,
  getMeetingById,
  getMeetingParticipants,
  addParticipant,
  recordTokenEvent,
  getTokenEventsByMeeting,
  recordAnnotation as dbRecordAnnotation,
  getAnnotationsByMeeting,
  recordPhaseEvent,
  endPhaseEvent,
  updateMeetingPhase,
  getInteractionStatistics,
  updateInteractionStatistics,
} from "./db";
import {
  saveCanvasOperation,
  getCanvasOperations,
  getCanvasOperationsSince,
  getLatestSequenceNumber,
  exportCanvasOperationsAsJSON,
} from "./canvas-db";
import { authRouter } from "./auth-router";
import { signUp, login, validatePasswordStrength, validateEmail } from "./auth-service";

/**
 * Token Engine - Core logic for managing the Expression Token
 * This is the heart of Orchestra-sec, implementing RBAC applied to speech
 */
class TokenEngine {
  private meetingId: number;
  private tokenHolderId: number | null = null;
  private tokenQueue: number[] = [];
  private currentPhase: "ideation" | "clarification" | "decision" | "feedback" | "none" = "none";
  private phaseStartTime: number = 0;
  private tokenStartTime: number = 0;
  private sequenceNumber: number = 0;
  private phaseSequenceNumber: number = 0;

  constructor(meetingId: number) {
    this.meetingId = meetingId;
  }

  async assignToken(participantId: number): Promise<void> {
    this.tokenHolderId = participantId;
    this.tokenStartTime = Date.now();
    await recordTokenEvent(this.meetingId, participantId, "assigned", undefined, this.sequenceNumber++);
  }

  async passToken(nextParticipantId: number): Promise<void> {
    if (this.tokenHolderId === null) {
      throw new Error("No token holder to pass from");
    }

    const duration = Date.now() - this.tokenStartTime;
    await recordTokenEvent(
      this.meetingId,
      this.tokenHolderId,
      "passed",
      duration,
      this.sequenceNumber++
    );

    this.tokenHolderId = nextParticipantId;
    this.tokenStartTime = Date.now();
    await recordTokenEvent(this.meetingId, nextParticipantId, "assigned", undefined, this.sequenceNumber++);
  }

  async releaseToken(): Promise<void> {
    if (this.tokenHolderId === null) {
      throw new Error("No token holder to release");
    }

    const duration = Date.now() - this.tokenStartTime;
    await recordTokenEvent(
      this.meetingId,
      this.tokenHolderId,
      "released",
      duration,
      this.sequenceNumber++
    );

    this.tokenHolderId = null;
    this.tokenStartTime = 0;
  }

  async transitionPhase(newPhase: "ideation" | "clarification" | "decision" | "feedback"): Promise<void> {
    this.currentPhase = newPhase;
    this.phaseStartTime = Date.now();
    await recordPhaseEvent(this.meetingId, newPhase, this.phaseSequenceNumber++);
    await updateMeetingPhase(this.meetingId, newPhase);
  }

  async recordAnnotationEvent(
    participantId: number,
    annotationType: string,
    content: any
  ): Promise<void> {
    if (this.tokenHolderId !== participantId) {
      throw new Error("Only token holder can annotate");
    }

    const tokenEvents = await getTokenEventsByMeeting(this.meetingId);
    const currentTokenEvent = tokenEvents[tokenEvents.length - 1];

    if (!currentTokenEvent) {
      throw new Error("No active token event");
    }

    await dbRecordAnnotation(
      this.meetingId,
      currentTokenEvent.id,
      participantId,
      annotationType,
      content,
      this.sequenceNumber++
    );
  }

  getState() {
    return {
      tokenHolderId: this.tokenHolderId,
      currentPhase: this.currentPhase,
      phaseStartTime: this.phaseStartTime,
      tokenStartTime: this.tokenStartTime,
    };
  }
}

// In-memory storage for active Token Engines (in production, use Redis)
const activeTokenEngines = new Map<number, TokenEngine>();

function getTokenEngine(meetingId: number): TokenEngine {
  if (!activeTokenEngines.has(meetingId)) {
    activeTokenEngines.set(meetingId, new TokenEngine(meetingId));
  }
  return activeTokenEngines.get(meetingId)!;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    signup: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        const result = await signUp({ email: input.email, password: input.password, name: input.name });
        return { success: true, user: result };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await login({ email: input.email, password: input.password });
        return { success: true, user: result };
      }),
    validatePassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .query(({ input }) => {
        return validatePasswordStrength(input.password);
      }),
    validateEmail: publicProcedure
      .input(z.object({ email: z.string() }))
      .query(({ input }) => {
        return {
          isValid: validateEmail(input.email),
        };
      })
  }),

  meetings: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createMeeting(input.title, input.description, ctx.user.id);
        return { success: true, meetingId: (result as any).insertId };
      }),

    getById: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await getMeetingById(input.meetingId);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return [];
    }),
  }),

  participants: router({
    add: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          displayName: z.string().min(1),
          role: z.enum(["proposer", "questioner", "clarifier", "decider", "observer"]).default("observer"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await addParticipant(input.meetingId, ctx.user.id, input.displayName, input.role);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await getMeetingParticipants(input.meetingId);
      }),
  }),

  token: router({
    assignToken: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          participantId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        await engine.assignToken(input.participantId);
        return { success: true, state: engine.getState() };
      }),

    passToken: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          nextParticipantId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        await engine.passToken(input.nextParticipantId);
        return { success: true, state: engine.getState() };
      }),

    releaseToken: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        await engine.releaseToken();
        return { success: true, state: engine.getState() };
      }),

    getState: publicProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        return engine.getState();
      }),
  }),

  phases: router({
    transition: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          phase: z.enum(["ideation", "clarification", "decision", "feedback"]),
        })
      )
      .mutation(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        await engine.transitionPhase(input.phase);
        return { success: true, state: engine.getState() };
      }),
  }),

  annotations: router({
    record: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          participantId: z.number(),
          annotationType: z.enum(["text", "drawing", "shape", "highlight", "arrow"]),
          content: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        const engine = getTokenEngine(input.meetingId);
        await engine.recordAnnotationEvent(input.participantId, input.annotationType, input.content);
        return { success: true };
      }),

    list: publicProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await getAnnotationsByMeeting(input.meetingId);
      }),
  }),

  statistics: router({
    getInteractionStats: publicProcedure
      .input(
        z.object({
          meetingId: z.number(),
          participantId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await getInteractionStatistics(input.meetingId, input.participantId);
      }),
  }),

  canvas: router({
    saveOperation: protectedProcedure
      .input(
        z.object({
          meetingId: z.number(),
          participantId: z.number(),
          operationType: z.enum(["draw", "erase", "text", "clear", "shape"]),
          operationData: z.any(),
          version: z.number(),
          operationId: z.string(),
          timestamp: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const seqNum = await getLatestSequenceNumber(input.meetingId);
        await saveCanvasOperation({
          meetingId: input.meetingId,
          participantId: input.participantId,
          operationType: input.operationType,
          operationData: input.operationData,
          version: input.version,
          operationId: input.operationId,
          timestamp: input.timestamp,
          sequenceNumber: seqNum + 1,
        });
        return { success: true, sequenceNumber: seqNum + 1 };
      }),

    getOperations: publicProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await getCanvasOperations(input.meetingId);
      }),

    getOperationsSince: publicProcedure
      .input(
        z.object({
          meetingId: z.number(),
          timestamp: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await getCanvasOperationsSince(input.meetingId, input.timestamp);
      }),

    reconstructState: publicProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        const operations = await getCanvasOperations(input.meetingId);
        return {
          operations,
          totalOperations: operations.length,
          reconstructedAt: new Date().toISOString(),
        };
      }),

    exportAsJSON: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await exportCanvasOperationsAsJSON(input.meetingId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
