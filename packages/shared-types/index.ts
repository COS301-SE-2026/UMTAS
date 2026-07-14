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

export const PDF_STREAM_FINGERPRINT_ALGORITHM_VERSION =
  "pdf-stream-payload-sha256-v1" as const;

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
    const objectMarker = indexOfPdfKeyword(bytes, "obj", cursor);
    if (objectMarker === -1) {
      break;
    }

    if (!hasObjectNumberPrefix(bytes, objectMarker)) {
      cursor = objectMarker + "obj".length;
      continue;
    }

    const objectEnd = indexOfPdfKeyword(
      bytes,
      "endobj",
      objectMarker + "obj".length,
    );
    if (objectEnd === -1) {
      break;
    }

    const payload = extractObjectStreamPayload(
      bytes,
      objectMarker + "obj".length,
      objectEnd,
    );
    if (payload) {
      payloads.push(payload);
    }

    cursor = objectEnd + "endobj".length;
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
  const firstByte = needle.codePointAt(0);
  if (firstByte === undefined) {
    return -1;
  }
  const maxStart = bytes.length - needle.length;

  for (let index = fromIndex; index <= maxStart; index += 1) {
    if (bytes[index] !== firstByte) {
      continue;
    }

    let matches = true;
    for (let needleIndex = 1; needleIndex < needle.length; needleIndex += 1) {
      if (bytes[index + needleIndex] !== needle.codePointAt(needleIndex)) {
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

function hasObjectNumberPrefix(
  bytes: Uint8Array,
  objectMarker: number,
): boolean {
  let cursor = objectMarker - 1;
  cursor = skipWhitespaceBackward(bytes, cursor);
  const generationEnd = cursor + 1;
  cursor = skipDigitsBackward(bytes, cursor);
  const generationStart = cursor + 1;

  cursor = skipWhitespaceBackward(bytes, cursor);
  const objectNumberEnd = cursor + 1;
  cursor = skipDigitsBackward(bytes, cursor);
  const objectNumberStart = cursor + 1;

  return generationStart < generationEnd && objectNumberStart < objectNumberEnd;
}

function extractObjectStreamPayload(
  bytes: Uint8Array,
  objectBodyStart: number,
  objectEnd: number,
): PdfStreamPayload | undefined {
  const dictionaryStart = indexOfAsciiSequence(bytes, "<<", objectBodyStart);
  if (dictionaryStart === -1 || dictionaryStart >= objectEnd) {
    return undefined;
  }

  const dictionaryEnd = findDictionaryEnd(bytes, dictionaryStart, objectEnd);
  if (dictionaryEnd === -1) {
    return undefined;
  }

  const payloadLength = parseDirectLength(
    bytes,
    dictionaryStart,
    dictionaryEnd,
  );
  if (payloadLength === undefined) {
    return undefined;
  }

  const streamMarker = indexOfPdfKeyword(bytes, "stream", dictionaryEnd, {
    requireLineEndingAfter: true,
  });
  if (streamMarker === -1 || streamMarker >= objectEnd) {
    return undefined;
  }

  const payloadStart = skipSingleLineEnding(
    bytes,
    streamMarker + "stream".length,
  );
  const payloadEnd = payloadStart + payloadLength;
  if (payloadEnd > objectEnd) {
    return undefined;
  }

  if (!hasEndstreamAtPayloadBoundary(bytes, payloadEnd, objectEnd)) {
    return undefined;
  }

  return { payload: bytes.subarray(payloadStart, payloadEnd) };
}

function findDictionaryEnd(
  bytes: Uint8Array,
  dictionaryStart: number,
  limit: number,
): number {
  let depth = 0;
  let cursor = dictionaryStart;

  while (cursor + 1 < limit) {
    if (bytes[cursor] === 60 && bytes[cursor + 1] === 60) {
      depth += 1;
      cursor += 2;
      continue;
    }

    if (bytes[cursor] === 62 && bytes[cursor + 1] === 62) {
      depth -= 1;
      cursor += 2;
      if (depth === 0) {
        return cursor;
      }
      continue;
    }

    cursor += 1;
  }

  return -1;
}

function parseDirectLength(
  bytes: Uint8Array,
  dictionaryStart: number,
  dictionaryEnd: number,
): number | undefined {
  let cursor = dictionaryStart;

  while (cursor < dictionaryEnd) {
    const lengthMarker = indexOfAsciiSequence(bytes, "/Length", cursor);
    if (lengthMarker === -1 || lengthMarker >= dictionaryEnd) {
      return undefined;
    }

    if (!isPdfDelimiter(bytes[lengthMarker + "/Length".length])) {
      cursor = lengthMarker + "/Length".length;
      continue;
    }

    cursor = skipWhitespaceForward(
      bytes,
      lengthMarker + "/Length".length,
      dictionaryEnd,
    );
    const numberStart = cursor;
    cursor = skipDigitsForward(bytes, cursor, dictionaryEnd);
    if (numberStart === cursor) {
      return undefined;
    }

    if (isIndirectReferenceSuffix(bytes, cursor, dictionaryEnd)) {
      return undefined;
    }

    const value = parseAsciiInteger(bytes, numberStart, cursor);
    if (!Number.isSafeInteger(value) || value < 0) {
      return undefined;
    }

    return value;
  }

  return undefined;
}

function isIndirectReferenceSuffix(
  bytes: Uint8Array,
  afterFirstNumber: number,
  limit: number,
): boolean {
  let cursor = skipWhitespaceForward(bytes, afterFirstNumber, limit);
  const secondNumberStart = cursor;
  cursor = skipDigitsForward(bytes, cursor, limit);
  if (secondNumberStart === cursor) {
    return false;
  }

  cursor = skipWhitespaceForward(bytes, cursor, limit);
  return bytes[cursor] === 82 && isPdfDelimiter(bytes[cursor + 1]);
}

function hasEndstreamAtPayloadBoundary(
  bytes: Uint8Array,
  payloadEnd: number,
  objectEnd: number,
): boolean {
  const marker = skipSingleLineEnding(bytes, payloadEnd);
  if (marker >= objectEnd) {
    return false;
  }

  return matchesPdfKeywordAt(bytes, "endstream", marker);
}

function matchesPdfKeywordAt(
  bytes: Uint8Array,
  keyword: string,
  index: number,
): boolean {
  const maxStart = bytes.length - keyword.length;
  if (index < 0 || index > maxStart) {
    return false;
  }

  for (let keywordIndex = 0; keywordIndex < keyword.length; keywordIndex += 1) {
    if (bytes[index + keywordIndex] !== keyword.codePointAt(keywordIndex)) {
      return false;
    }
  }

  return hasPdfKeywordBoundaries(bytes, index, keyword, {});
}

function indexOfAsciiSequence(
  bytes: Uint8Array,
  needle: string,
  fromIndex: number,
): number {
  const firstByte = needle.codePointAt(0);
  if (firstByte === undefined) {
    return -1;
  }
  const maxStart = bytes.length - needle.length;

  for (let index = fromIndex; index <= maxStart; index += 1) {
    if (bytes[index] !== firstByte) {
      continue;
    }

    let matches = true;
    for (let needleIndex = 1; needleIndex < needle.length; needleIndex += 1) {
      if (bytes[index + needleIndex] !== needle.codePointAt(needleIndex)) {
        matches = false;
        break;
      }
    }

    if (matches) {
      return index;
    }
  }

  return -1;
}

function skipWhitespaceForward(
  bytes: Uint8Array,
  index: number,
  limit: number,
): number {
  let cursor = index;
  while (cursor < limit && isPdfWhitespace(bytes[cursor])) {
    cursor += 1;
  }

  return cursor;
}

function skipWhitespaceBackward(bytes: Uint8Array, index: number): number {
  let cursor = index;
  while (cursor >= 0 && isPdfWhitespace(bytes[cursor])) {
    cursor -= 1;
  }

  return cursor;
}

function skipDigitsForward(
  bytes: Uint8Array,
  index: number,
  limit: number,
): number {
  let cursor = index;
  while (cursor < limit && isAsciiDigit(bytes[cursor])) {
    cursor += 1;
  }

  return cursor;
}

function skipDigitsBackward(bytes: Uint8Array, index: number): number {
  let cursor = index;
  while (cursor >= 0 && isAsciiDigit(bytes[cursor])) {
    cursor -= 1;
  }

  return cursor;
}

function parseAsciiInteger(
  bytes: Uint8Array,
  start: number,
  end: number,
): number {
  let value = 0;
  for (let cursor = start; cursor < end; cursor += 1) {
    const byte = bytes[cursor];
    if (byte === undefined || !isAsciiDigit(byte)) {
      return Number.NaN;
    }

    value = value * 10 + byte - 48;
  }

  return value;
}

function isPdfWhitespace(byte: number | undefined): boolean {
  return (
    byte === 0 ||
    byte === 9 ||
    byte === 10 ||
    byte === 12 ||
    byte === 13 ||
    byte === 32
  );
}

function isAsciiDigit(byte: number | undefined): boolean {
  return byte !== undefined && byte >= 48 && byte <= 57;
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
