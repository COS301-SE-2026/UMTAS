import { z } from "zod";
import {
  JsonRecordSchema,
  ActivityTypeSchema,
  ParsedDayOfWeekSchema,
  IsoDateSchema,
  WorkerCallbackErrorSchema,
} from "./common.js";

export const PdfParseJobDataSchema = z.strictObject({
  jobId: z.string().trim().min(1),
  fileKey: z.string().trim().min(1),
  adapterKey: z.string().trim().min(1),
});

export type PdfParseJobData = z.infer<typeof PdfParseJobDataSchema>;

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

const ParsedEventCandidateBaseShape = {
  moduleCode: z.string(),
  activityType: ActivityTypeSchema,
  activityCode: z.string(),
  title: z.string(),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: "Expected a time in HH:mm format.",
  }),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: "Expected a time in HH:mm format.",
  }),
  venues: z.array(z.string()),
  metadata: JsonRecordSchema,
  warnings: z.array(ParseAnnotationSchema),
};

export const ParsedEventCandidateSchema = z
  .discriminatedUnion("isRecurring", [
    z.strictObject({
      ...ParsedEventCandidateBaseShape,
      day: ParsedDayOfWeekSchema,
      date: z.null(),
      isRecurring: z.literal(true),
    }),
    z.strictObject({
      ...ParsedEventCandidateBaseShape,
      day: z.null(),
      date: IsoDateSchema,
      isRecurring: z.literal(false),
    }),
  ])
  .refine((event) => event.startTime < event.endTime, {
    path: ["endTime"],
    message: "endTime must be later than startTime.",
  });

export type ParsedEventCandidate = z.infer<typeof ParsedEventCandidateSchema>;

export const PdfParserResultSchema = z.strictObject({
  modules: z.array(ParsedModuleCandidateSchema),
  events: z.array(ParsedEventCandidateSchema),
  warnings: z.array(ParseAnnotationSchema),
});

export type PdfParserResult = z.infer<typeof PdfParserResultSchema>;

export const PdfParserCallbackPayloadSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("completed"),
    result: PdfParserResultSchema,
  }),
  z.strictObject({
    status: z.literal("failed"),
    error: WorkerCallbackErrorSchema,
  }),
]);

export type PdfParserCallbackPayload = z.infer<
  typeof PdfParserCallbackPayloadSchema
>;
