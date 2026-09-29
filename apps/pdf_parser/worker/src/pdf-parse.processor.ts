import path from "node:path";
import { stat } from "node:fs/promises";
import type {
  WorkerCallbackPayload,
  WorkerJobContext,
  WorkerProcessor,
} from "bullmq-worker-core";
import type { PdfParseJobData } from "shared-types";
import type { ParserExecutor, PdfStorageClient } from "./contracts.js";
import { validatePdfParseJobData } from "./validation.js";

export interface PdfParseProcessorOptions {
  storageClient: PdfStorageClient;
  parserExecutor: ParserExecutor;
  inputFileName?: string;
  getInputBytes?: (path: string) => Promise<number>;
}

export class PdfParseProcessor implements WorkerProcessor<PdfParseJobData> {
  private readonly storageClient: PdfStorageClient;
  private readonly parserExecutor: ParserExecutor;
  private readonly inputFileName: string;
  private readonly getInputBytes: (path: string) => Promise<number>;

  constructor(options: PdfParseProcessorOptions) {
    this.storageClient = options.storageClient;
    this.parserExecutor = options.parserExecutor;
    this.inputFileName = options.inputFileName ?? "input.pdf";
    this.getInputBytes =
      options.getInputBytes ??
      (async (filePath) => (await stat(filePath)).size);
  }

  async process(
    context: WorkerJobContext<PdfParseJobData>,
  ): Promise<WorkerCallbackPayload> {
    validatePdfParseJobData(context.data);

    const inputPath = path.join(context.tempDir, this.inputFileName);
    context.logger.info("Downloading PDF parse input", {
      jobId: context.data.jobId,
      fileKey: context.data.fileKey,
    });

    await this.storageClient.downloadFile(
      context.data.fileKey,
      inputPath,
      context.abortSignal,
    );

    const inputBytes = await this.getInputBytes(inputPath);
    const startedAt = performance.now();
    const result = await this.parserExecutor.parsePdf({
      requestId: context.data.jobId,
      adapterKey: context.data.adapterKey,
      filePath: inputPath,
      abortSignal: context.abortSignal,
    });
    const durationMs = performance.now() - startedAt;
    context.logger.info("PDF_PARSER_PROCESSING_DURATION", {
      jobId: context.data.jobId,
      durationMs,
      inputBytes,
      msPerKb: inputBytes > 0 ? durationMs / (inputBytes / 1024) : null,
    });

    return {
      status: "completed",
      result,
    };
  }
}
