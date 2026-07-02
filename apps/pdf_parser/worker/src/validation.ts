import { WorkerExecutionError } from "bullmq-worker-core";
import type {
  ParsedEventCandidate,
  ParsedModuleCandidate,
  PdfParseJobData,
  PdfParserResult,
} from "shared-types";

const EVENT_TYPES = new Set(["lecture", "tutorial", "prac", "test", "exam"]);

export function validatePdfParseJobData(data: PdfParseJobData): void {
  if (!isNonEmptyString(data.jobId)) {
    throw new WorkerExecutionError(
      "INVALID_JOB_DATA",
      "PDF parse jobId is required.",
    );
  }

  if (!isNonEmptyString(data.fileKey)) {
    throw new WorkerExecutionError(
      "INVALID_JOB_DATA",
      "PDF parse fileKey is required.",
    );
  }

  if (!isNonEmptyString(data.adapterKey)) {
    throw new WorkerExecutionError(
      "INVALID_JOB_DATA",
      "PDF parse adapterKey is required.",
    );
  }
}

export function validatePdfParserResult(result: unknown): PdfParserResult {
  assertExactKeys(result, ["events", "modules", "warnings"], "parser result");

  if (!Array.isArray(result.modules)) {
    throw invalidResult("Parser result modules must be an array.");
  }

  if (!Array.isArray(result.events)) {
    throw invalidResult("Parser result events must be an array.");
  }

  if (!Array.isArray(result.warnings)) {
    throw invalidResult("Parser result warnings must be an array.");
  }

  validateAnnotations(result.warnings, "parser result warnings");
  result.modules.forEach((module, index) => validateModule(module, index));
  result.events.forEach((event, index) => validateEvent(event, index));

  return result as unknown as PdfParserResult;
}

function validateModule(
  module: unknown,
  index: number,
): asserts module is ParsedModuleCandidate {
  if (!isRecord(module)) {
    throw invalidResult("Parser module candidate must be an object.", {
      index,
    });
  }

  assertExactKeys(module, ["code", "metadata", "name", "warnings"], "module");

  if (typeof module.code !== "string") {
    throw invalidResult("Parser module code must be a string.", { index });
  }

  if (module.name !== null && typeof module.name !== "string") {
    throw invalidResult("Parser module name must be a string or null.", {
      index,
    });
  }

  if (!isRecord(module.metadata)) {
    throw invalidResult("Parser module metadata must be an object.", { index });
  }

  if (!Array.isArray(module.warnings)) {
    throw invalidResult("Parser module warnings must be an array.", { index });
  }

  validateAnnotations(module.warnings, "module warnings", index);
}

function validateEvent(
  event: unknown,
  index: number,
): asserts event is ParsedEventCandidate {
  if (!isRecord(event)) {
    throw invalidResult("Parser event candidate must be an object.", { index });
  }

  assertExactKeys(
    event,
    [
      "date",
      "day",
      "endTime",
      "isRecurring",
      "metadata",
      "moduleCode",
      "sectionLabel",
      "startTime",
      "title",
      "type",
      "venues",
      "warnings",
    ],
    "event",
  );

  if (typeof event.moduleCode !== "string") {
    throw invalidResult("Parser event moduleCode must be a string.", { index });
  }

  if (typeof event.sectionLabel !== "string") {
    throw invalidResult("Parser event sectionLabel must be a string.", {
      index,
    });
  }

  if (typeof event.title !== "string") {
    throw invalidResult("Parser event title must be a string.", { index });
  }

  if (event.day !== null && typeof event.day !== "string") {
    throw invalidResult("Parser event day must be a string or null.", {
      index,
    });
  }

  if (event.date !== null && typeof event.date !== "string") {
    throw invalidResult("Parser event date must be a string or null.", {
      index,
    });
  }

  if (typeof event.startTime !== "string") {
    throw invalidResult("Parser event startTime must be a string.", { index });
  }

  if (typeof event.endTime !== "string") {
    throw invalidResult("Parser event endTime must be a string.", { index });
  }

  if (!Array.isArray(event.venues)) {
    throw invalidResult("Parser event venues must be an array.", { index });
  }

  if (!isRecord(event.metadata)) {
    throw invalidResult("Parser event metadata must be an object.", { index });
  }

  if (!Array.isArray(event.warnings)) {
    throw invalidResult("Parser event warnings must be an array.", { index });
  }

  validateAnnotations(event.warnings, "event warnings", index);

  if (typeof event.isRecurring !== "boolean") {
    throw invalidResult("Parser event isRecurring must be a boolean.", {
      index,
    });
  }

  if (typeof event.type !== "string" || !EVENT_TYPES.has(event.type)) {
    throw invalidResult("Parser event type is unsupported.", {
      index,
      type: event.type,
    });
  }

  const venues = event.venues;
  if (
    !Array.isArray(venues) ||
    !venues.every((venue) => typeof venue === "string")
  ) {
    throw invalidResult("Parser event venues must be strings.", { index });
  }
}

function validateAnnotations(
  annotations: unknown,
  label: string,
  candidateIndex?: number,
): void {
  if (!Array.isArray(annotations)) {
    throw invalidResult(`${label} must be an array.`, {
      index: candidateIndex,
    });
  }

  annotations.forEach((annotation, index) => {
    assertExactKeys(annotation, ["code", "details", "message"], label);

    if (typeof annotation.code !== "string") {
      throw invalidResult(`${label} code must be a string.`, {
        candidateIndex,
        index,
      });
    }

    if (typeof annotation.message !== "string") {
      throw invalidResult(`${label} message must be a string.`, {
        candidateIndex,
        index,
      });
    }

    if (!isRecord(annotation.details)) {
      throw invalidResult(`${label} details must be an object.`, {
        candidateIndex,
        index,
      });
    }
  });
}

function assertExactKeys(
  value: unknown,
  expectedKeys: string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw invalidResult(`${label} must be a JSON object.`);
  }

  const actualKeys = Object.keys(value).sort();
  const expected = expectedKeys.slice().sort();

  if (!hasSameKeys(actualKeys, expected)) {
    throw invalidResult(
      `${label} must contain exactly: ${expected.join(", ")}.`,
      {
        actualKeys,
        expected,
      },
    );
  }
}

function hasSameKeys(actualKeys: string[], expectedKeys: string[]): boolean {
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (let index = 0; index < actualKeys.length; index += 1) {
    if (actualKeys[index] !== expectedKeys[index]) {
      return false;
    }
  }

  return true;
}

function invalidResult(
  message: string,
  details: Record<string, unknown> = {},
): WorkerExecutionError {
  return new WorkerExecutionError("INVALID_PARSER_RESULT", message, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
