import { WorkerExecutionError } from "bullmq-worker-core";
import {
  PdfParseJobDataSchema,
  PdfParserResultSchema,
  type PdfParseJobData,
  type PdfParserResult,
} from "shared-types";

export function validatePdfParseJobData(data: PdfParseJobData): void {
  const result = PdfParseJobDataSchema.safeParse(data);
  if (result.success) {
    return;
  }

  const firstField = result.error.issues[0]?.path[0];
  const field =
    firstField === "jobId" || firstField === "fileKey"
      ? firstField
      : "adapterKey";

  throw new WorkerExecutionError(
    "INVALID_JOB_DATA",
    `PDF parse ${field} is required.`,
    { issues: result.error.issues },
  );
}

export function validatePdfParserResult(result: unknown): PdfParserResult {
  const parserResult = PdfParserResultSchema.safeParse(result);
  if (parserResult.success) {
    return parserResult.data;
  }

  throw new WorkerExecutionError(
    "INVALID_PARSER_RESULT",
    "PDF parser result did not match the shared parser contract.",
    { issues: parserResult.error.issues },
  );
}
