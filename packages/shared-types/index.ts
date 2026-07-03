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

export const PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION: "pdf-stream-payload-sha256-v1" =
  "pdf-stream-payload-sha256-v1";

export type PdfStreamFingerprintAlgorithmVersion =
  typeof PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION;

export type PdfStreamFingerprintResult =
  | {
      ok: true;
      hash: string;
      streamCount: number;
      algorithmVersion: PdfStreamFingerprintAlgorithmVersion;
    }
  | {
      ok: false;
      streamCount: 0;
      algorithmVersion: PdfStreamFingerprintAlgorithmVersion;
      reason: "NO_STREAMS_FOUND";
    };

export interface PdfStreamPayload {
  payload: Uint8Array;
}

export interface Sha256Hash {
  update(input: Uint8Array): void;
  digestHex(): string;
}

export function extractPdfStreamPayloads(
  bytes: Uint8Array,
): PdfStreamPayload[] {
  const payloads: PdfStreamPayload[] = [];
  let cursor = 0;

  while (cursor < bytes.length) {
    const streamMarker = indexOfPdfKeyword(bytes, "stream", cursor, {
      requireLineEndingAfter: true,
    });
    if (streamMarker === -1) {
      break;
    }

    let payloadStart = streamMarker + "stream".length;
    payloadStart = skipSingleLineEnding(bytes, payloadStart);

    const endMarker = indexOfPdfKeyword(bytes, "endstream", payloadStart);
    if (endMarker === -1) {
      break;
    }

    const payloadEnd = stripSingleTrailingLineEnding(
      bytes,
      payloadStart,
      endMarker,
    );
    payloads.push({ payload: bytes.subarray(payloadStart, payloadEnd) });
    cursor = endMarker + "endstream".length;
  }

  return payloads;
}

export function computePdfStreamFingerprint(
  bytes: Uint8Array,
  hash: Sha256Hash,
): PdfStreamFingerprintResult {
  const payloads = extractPdfStreamPayloads(bytes);
  if (payloads.length === 0) {
    return {
      ok: false,
      streamCount: 0,
      algorithmVersion: PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
      reason: "NO_STREAMS_FOUND",
    };
  }

  for (const { payload } of payloads) {
    hash.update(encodeUint64BigEndian(payload.byteLength));
    hash.update(payload);
  }

  return {
    ok: true,
    hash: hash.digestHex(),
    streamCount: payloads.length,
    algorithmVersion: PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION,
  };
}

function indexOfPdfKeyword(
  bytes: Uint8Array,
  needle: string,
  fromIndex: number,
  options: { requireLineEndingAfter?: boolean } = {},
): number {
  const firstByte = needle.charCodeAt(0);
  const maxStart = bytes.length - needle.length;

  for (let index = fromIndex; index <= maxStart; index += 1) {
    if (bytes[index] !== firstByte) {
      continue;
    }

    let matches = true;
    for (let needleIndex = 1; needleIndex < needle.length; needleIndex += 1) {
      if (bytes[index + needleIndex] !== needle.charCodeAt(needleIndex)) {
        matches = false;
        break;
      }
    }

    if (matches && hasPdfKeywordBoundaries(bytes, index, needle, options)) {
      return index;
    }
  }

  return -1;
}

function hasPdfKeywordBoundaries(
  bytes: Uint8Array,
  index: number,
  keyword: string,
  options: { requireLineEndingAfter?: boolean },
): boolean {
  const afterIndex = index + keyword.length;
  if (!isPdfDelimiter(bytes[index - 1])) {
    return false;
  }

  if (options.requireLineEndingAfter) {
    return bytes[afterIndex] === 10 || bytes[afterIndex] === 13;
  }

  return isPdfDelimiter(bytes[afterIndex]);
}

function isPdfDelimiter(byte: number | undefined): boolean {
  if (byte === undefined) {
    return true;
  }

  return (
    byte === 0 ||
    byte === 9 ||
    byte === 10 ||
    byte === 12 ||
    byte === 13 ||
    byte === 32 ||
    byte === 37 ||
    byte === 40 ||
    byte === 41 ||
    byte === 47 ||
    byte === 60 ||
    byte === 62 ||
    byte === 91 ||
    byte === 93 ||
    byte === 123 ||
    byte === 125
  );
}

function skipSingleLineEnding(bytes: Uint8Array, index: number): number {
  if (bytes[index] === 13 && bytes[index + 1] === 10) {
    return index + 2;
  }

  if (bytes[index] === 10 || bytes[index] === 13) {
    return index + 1;
  }

  return index;
}

function stripSingleTrailingLineEnding(
  bytes: Uint8Array,
  start: number,
  end: number,
): number {
  if (end - start >= 2 && bytes[end - 2] === 13 && bytes[end - 1] === 10) {
    return end - 2;
  }

  if (end > start && (bytes[end - 1] === 10 || bytes[end - 1] === 13)) {
    return end - 1;
  }

  return end;
}

function encodeUint64BigEndian(value: number): Uint8Array {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      "PDF stream payload length must be a safe non-negative integer",
    );
  }

  const bytes = new Uint8Array(8);
  let remaining = value;
  for (let index = 7; index >= 0; index -= 1) {
    bytes[index] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  return bytes;
}
