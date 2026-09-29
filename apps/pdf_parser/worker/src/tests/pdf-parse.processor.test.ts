import assert from "node:assert/strict";
import test from "node:test";
import type { PdfParserResult } from "shared-types";
import { PdfParseProcessor } from "../pdf-parse.processor.js";
import type { ParserExecutor, PdfStorageClient } from "../contracts.js";

const parserResult: PdfParserResult = {
  modules: [
    {
      code: "COS301",
      name: null,
      metadata: {},
      warnings: [],
    },
  ],
  events: [
    {
      moduleCode: "COS301",
      activityType: "lecture",
      activityCode: "P1",
      title: "COS301 P1",
      day: "monday",
      date: null,
      startTime: "08:30",
      endTime: "09:20",
      venues: ["Informatorium"],
      isRecurring: true,
      metadata: {},
      warnings: [],
    },
  ],
  warnings: [],
};

test("PdfParseProcessor downloads the PDF then parses and returns callback payload", async () => {
  // NOSONAR - node:assert assertions are present.
  const calls: string[] = [];
  const storageClient: PdfStorageClient = {
    downloadFile: async (fileKey, destinationPath) => {
      calls.push(`download:${fileKey}:${destinationPath}`);
    },
  };
  const parserExecutor: ParserExecutor = {
    parsePdf: async (request) => {
      calls.push(
        `parse:${request.requestId}:${request.adapterKey}:${request.filePath}`,
      );
      return parserResult;
    },
  };

  const logs: Array<{ message: string; metadata?: Record<string, unknown> }> =
    [];
  const processor = new PdfParseProcessor({
    storageClient,
    parserExecutor,
    getInputBytes: async () => 1024,
  });
  const payload = await processor.process({
    data: {
      jobId: "parse-1",
      fileKey: "uploads/parse-1.pdf",
      adapterKey: "up",
    },
    tempDir: "/tmp/parse-1",
    logger: {
      ...noopLogger,
      info: (message: string, metadata?: Record<string, unknown>) => {
        logs.push(metadata ? { message, metadata } : { message });
      },
    },
    abortSignal: new AbortController().signal,
  });

  assert.deepEqual(calls, [
    "download:uploads/parse-1.pdf:/tmp/parse-1/input.pdf",
    "parse:parse-1:up:/tmp/parse-1/input.pdf",
  ]);
  assert.deepEqual(payload, {
    status: "completed",
    result: parserResult,
  });
  const timing = logs.find(
    (log) => log.message === "PDF_PARSER_PROCESSING_DURATION",
  );
  assert.ok(timing);
  assert.equal(timing.metadata?.inputBytes, 1024);
  assert.equal(timing.metadata?.msPerKb, timing.metadata?.durationMs);
});

const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
