import type { PdfParseJobData, PdfParserResult } from "shared-types";

export type PdfParseExecutionMode = "cli" | "process-pool";

export interface PdfParseRequest {
  requestId: string;
  adapterKey: string;
  filePath: string;
  abortSignal: AbortSignal;
}

export interface ParserExecutor {
  parsePdf(request: PdfParseRequest): Promise<PdfParserResult>;
  close?(): Promise<void>;
}

export interface PdfStorageClient {
  downloadFile(
    fileKey: string,
    destinationPath: string,
    abortSignal?: AbortSignal,
  ): Promise<void>;
}

export type PdfParseWorkerJobData = PdfParseJobData;
