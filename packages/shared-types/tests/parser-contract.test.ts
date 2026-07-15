import test from "node:test";
import {
  ParsedEventCandidateSchema,
  PdfParserCallbackPayloadSchema,
} from "../index.js";

const baseEvent = {
  moduleCode: "COS101",
  activityType: "lecture" as const,
  activityCode: "L1",
  title: "COS101 Lecture",
  startTime: "08:30",
  endTime: "09:20",
  venues: [],
  metadata: {},
  warnings: [],
};

test("parsed recurring events require a weekday and exclude a date", (t) => {
  const valid = ParsedEventCandidateSchema.safeParse({
    ...baseEvent,
    day: "Monday",
    date: null,
    isRecurring: true,
  });
  const missingDay = ParsedEventCandidateSchema.safeParse({
    ...baseEvent,
    day: null,
    date: null,
    isRecurring: true,
  });

  t.assert.equal(valid.success, true);
  t.assert.equal(missingDay.success, false);
});

test("parsed recurring events normalize supported weekday variants", (t) => {
  const variants = {
    Monday: "monday",
    " TUES ": "tuesday",
    Wed: "wednesday",
    thurs: "thursday",
    FRI: "friday",
    Saturday: "saturday",
    sun: "sunday",
  } as const;

  for (const [day, expected] of Object.entries(variants)) {
    const result = ParsedEventCandidateSchema.safeParse({
      ...baseEvent,
      day,
      date: null,
      isRecurring: true,
    });

    t.assert.equal(result.success, true);
    if (result.success) t.assert.equal(result.data.day, expected);
  }
});

test("parsed recurring events reject unsupported weekdays", (t) => {
  const result = ParsedEventCandidateSchema.safeParse({
    ...baseEvent,
    day: "Funday",
    date: null,
    isRecurring: true,
  });

  t.assert.equal(result.success, false);
});

test("parsed non-recurring events require a date and exclude a weekday", (t) => {
  const valid = ParsedEventCandidateSchema.safeParse({
    ...baseEvent,
    day: null,
    date: "2026-03-17",
    isRecurring: false,
  });
  const missingDate = ParsedEventCandidateSchema.safeParse({
    ...baseEvent,
    day: null,
    date: null,
    isRecurring: false,
  });

  t.assert.equal(valid.success, true);
  t.assert.equal(missingDate.success, false);
});

test("parsed events reject every contradictory recurrence combination", (t) => {
  const contradictoryEvents = [
    { day: null, date: "2026-03-17", isRecurring: true },
    { day: "Monday", date: "2026-03-17", isRecurring: true },
    { day: "Monday", date: null, isRecurring: false },
    { day: "Monday", date: "2026-03-17", isRecurring: false },
  ];

  for (const event of contradictoryEvents) {
    t.assert.equal(
      ParsedEventCandidateSchema.safeParse({ ...baseEvent, ...event }).success,
      false,
    );
  }
});

test("parser callback status makes result and error mutually exclusive", (t) => {
  const result = { modules: [], events: [], warnings: [] };
  const error = { code: "PARSE_FAILED", message: "bad pdf" };

  t.assert.equal(
    PdfParserCallbackPayloadSchema.safeParse({
      status: "completed",
      result,
      error,
    }).success,
    false,
  );
  t.assert.equal(
    PdfParserCallbackPayloadSchema.safeParse({
      status: "failed",
      error,
      result,
    }).success,
    false,
  );
});
