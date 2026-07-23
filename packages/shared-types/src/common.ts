import { z } from "zod";

export const JsonRecordSchema = z.record(z.string(), z.unknown());

export const ActivityTypeSchema = z.enum([
  "lecture",
  "tutorial",
  "prac",
  "test",
  "exam",
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const DayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

const ParsedDayAliasSchema = z.enum([
  "mon",
  "monday",
  "tue",
  "tues",
  "tuesday",
  "wed",
  "wednesday",
  "thu",
  "thur",
  "thurs",
  "thursday",
  "fri",
  "friday",
  "sat",
  "saturday",
  "sun",
  "sunday",
]);

const parsedDayAliases = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
} as const satisfies Record<z.infer<typeof ParsedDayAliasSchema>, DayOfWeek>;

export const ParsedDayOfWeekSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(ParsedDayAliasSchema)
  .transform((day) => parsedDayAliases[day]);

export const TimeOfDaySchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
  message: "Expected a time in HH:mm format.",
});

export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Expected an ISO calendar date (YYYY-MM-DD).",
  })
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    { message: "Expected a real ISO calendar date." },
  );

export const WorkerCallbackErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  details: JsonRecordSchema.optional(),
});

export type WorkerCallbackError = z.infer<typeof WorkerCallbackErrorSchema>;
