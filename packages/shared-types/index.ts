import { z } from "zod";

const JsonRecordSchema = z.record(z.string(), z.unknown());

export const PdfParseJobDataSchema = z.strictObject({
  jobId: z.string().trim().min(1),
  fileKey: z.string().trim().min(1),
  adapterKey: z.string().trim().min(1),
});

export type PdfParseJobData = z.infer<typeof PdfParseJobDataSchema>;

export interface TimetableSolveJobData {
  jobId: string;
  solverKey: string;
  mode: "feasibility" | "optimization";
}

export const ParseAnnotationSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  details: JsonRecordSchema,
});

export type ParseAnnotation = z.infer<typeof ParseAnnotationSchema>;

export const ParsedModuleCandidateSchema = z.strictObject({
  code: z.string(),
  name: z.string().nullable(),
  metadata: JsonRecordSchema,
  warnings: z.array(ParseAnnotationSchema),
});

export type ParsedModuleCandidate = z.infer<typeof ParsedModuleCandidateSchema>;

export const ParsedEventCandidateSchema = z.strictObject({
  moduleCode: z.string(),
  type: z.enum(["lecture", "tutorial", "prac", "test", "exam"]),
  sectionLabel: z.string(),
  title: z.string(),
  day: z.string().nullable(),
  date: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  venues: z.array(z.string()),
  isRecurring: z.boolean(),
  metadata: JsonRecordSchema,
  warnings: z.array(ParseAnnotationSchema),
});

export type ParsedEventCandidate = z.infer<typeof ParsedEventCandidateSchema>;

export const PdfParserResultSchema = z.strictObject({
  modules: z.array(ParsedModuleCandidateSchema),
  events: z.array(ParsedEventCandidateSchema),
  warnings: z.array(ParseAnnotationSchema),
});

export type PdfParserResult = z.infer<typeof PdfParserResultSchema>;

export const WorkerCallbackErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  details: JsonRecordSchema.optional(),
});

export type WorkerCallbackError = z.infer<typeof WorkerCallbackErrorSchema>;

export const PdfParserCallbackPayloadSchema = z
  .strictObject({
    status: z.enum(["completed", "failed"]),
    result: PdfParserResultSchema.optional(),
    error: WorkerCallbackErrorSchema.optional(),
  })
  .superRefine((payload, context) => {
    if (payload.status === "completed" && !payload.result) {
      context.addIssue({
        code: "custom",
        path: ["result"],
        message: "Completed parser callbacks require result.",
      });
    }

    if (payload.status === "failed" && !payload.error) {
      context.addIssue({
        code: "custom",
        path: ["error"],
        message: "Failed parser callbacks require error.",
      });
    }
  });

export type PdfParserCallbackPayload = z.infer<
  typeof PdfParserCallbackPayloadSchema
>;

export interface SolverCallbackPayload {
  status: "completed" | "failed";
  result?: Record<string, unknown>;
  error?: WorkerCallbackError;
}
