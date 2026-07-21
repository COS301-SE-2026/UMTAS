import { z } from "zod";
import {
  JsonRecordSchema,
  ActivityTypeSchema,
  DayOfWeekSchema,
  TimeOfDaySchema,
  IsoDateSchema,
  WorkerCallbackErrorSchema,
} from "./common.js";

export const SolverEngineSchema = z.enum(["auto", "cp-sat", "ga"]);

export type SolverEngine = z.infer<typeof SolverEngineSchema>;

export const SolverHeuristicPreferenceSchema = z.strictObject({
  key: z.string().trim().min(1),
  weight: z.number().finite().optional(),
  parameters: JsonRecordSchema.optional(),
});

export type SolverHeuristicPreference = z.infer<
  typeof SolverHeuristicPreferenceSchema
>;

export const SolverPreferencesSchema = z.strictObject({
  heuristics: z.array(SolverHeuristicPreferenceSchema).default([]),
});

export type SolverPreferences = z.infer<typeof SolverPreferencesSchema>;

export const TimetableSolveJobDataSchema = z.strictObject({
  jobId: z.string().trim().min(1),
  attemptToken: z.uuid(),
  solveMode: z.enum(["feasibility", "optimization"]),
  engine: SolverEngineSchema.default("auto"),
});

export type TimetableSolveJobData = z.infer<typeof TimetableSolveJobDataSchema>;

export const SchedulingEventSchema = z
  .strictObject({
    eventId: z.string().trim().min(1),
    moduleCode: z.string().trim().min(1),
    activityType: ActivityTypeSchema,
    activityCode: z.string().trim().min(1),
    requiredSelections: z.number().int().positive().default(1),
    date: IsoDateSchema.optional(),
    dayOfWeek: DayOfWeekSchema.optional(),
    startTime: TimeOfDaySchema,
    endTime: TimeOfDaySchema,
    venues: z
      .array(
        z.strictObject({
          id: z.string().trim().min(1),
          name: z.string().trim().min(1),
        }),
      )
      .default([]),
  })
  .superRefine((event, context) => {
    if (Boolean(event.date) === Boolean(event.dayOfWeek)) {
      context.addIssue({
        code: "custom",
        message: "Scheduling events require exactly one of date or dayOfWeek.",
      });
    }

    if (event.startTime >= event.endTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be later than startTime.",
      });
    }
  });

export type SchedulingEvent = z.infer<typeof SchedulingEventSchema>;

export const SchedulingProblemSchema = z.strictObject({
  events: z.array(SchedulingEventSchema),
});

export type SchedulingProblem = z.infer<typeof SchedulingProblemSchema>;

export const TimetableSolutionSchema = z.strictObject({
  selectedEventIds: z.array(z.string().trim().min(1)),
});

export type TimetableSolution = z.infer<typeof TimetableSolutionSchema>;

export const SolverInputSchema = z.strictObject({
  schedulingProblem: SchedulingProblemSchema,
  preferences: SolverPreferencesSchema.default({ heuristics: [] }),
});

export type SolverInput = z.infer<typeof SolverInputSchema>;

export const SolverHeuristicScoreSchema = z.strictObject({
  key: z.string().trim().min(1),
  score: z.number().finite(),
  details: JsonRecordSchema.optional(),
});

export type SolverHeuristicScore = z.infer<typeof SolverHeuristicScoreSchema>;

export const SolverConflictSchema = z.strictObject({
  eventIds: z.tuple([z.string().trim().min(1), z.string().trim().min(1)]),
});

export const SolverResultMetadataSchema = z
  .object({
    conflictCount: z.number().int().nonnegative(),
    conflicts: z.array(SolverConflictSchema),
    solveMode: z.enum(["feasibility", "optimization"]),
  })
  .catchall(z.unknown());

export const SolverResultSchema = z
  .strictObject({
    engine: z.enum(["cp-sat", "ga"]),
    outcome: z.enum(["conflict-free", "best-effort"]),
    timetableSolution: TimetableSolutionSchema,
    heuristicScores: z.array(SolverHeuristicScoreSchema).default([]),
    metadata: SolverResultMetadataSchema,
  })
  .superRefine((result, context) => {
    if (result.metadata.conflictCount !== result.metadata.conflicts.length) {
      context.addIssue({
        code: "custom",
        path: ["metadata", "conflictCount"],
        message: "conflictCount must equal the number of conflicts.",
      });
    }
    const expectedOutcome =
      result.metadata.conflictCount === 0 ? "conflict-free" : "best-effort";
    if (result.outcome !== expectedOutcome) {
      context.addIssue({
        code: "custom",
        path: ["outcome"],
        message: `outcome must be ${expectedOutcome} for this conflict count.`,
      });
    }
  });

export type SolverResult = z.infer<typeof SolverResultSchema>;

export const SolverCliFeasibleOutputSchema = z.strictObject({
  status: z.literal("feasible"),
  outcome: z.enum(["conflict-free", "best-effort"]),
  timetableSolution: TimetableSolutionSchema,
  heuristicScores: z.array(SolverHeuristicScoreSchema).default([]),
  metadata: SolverResultMetadataSchema,
});

export const SolverCliOutputSchema = z.discriminatedUnion("status", [
  SolverCliFeasibleOutputSchema,
  z.strictObject({ status: z.literal("infeasible") }),
]);

export type SolverCliOutput = z.infer<typeof SolverCliOutputSchema>;

export const SolverCallbackPayloadSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("completed"),
    result: SolverResultSchema,
  }),
  z.strictObject({
    status: z.literal("failed"),
    error: WorkerCallbackErrorSchema,
  }),
]);

export type SolverCallbackPayload = z.infer<typeof SolverCallbackPayloadSchema>;
