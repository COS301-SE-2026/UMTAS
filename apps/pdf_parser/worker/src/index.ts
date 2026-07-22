import {
  HttpCallbackClient,
  createWorkerHost,
  type WorkerHostOptions,
} from "bullmq-worker-core";
import type { PdfParseJobData } from "shared-types";
import {
  buildPdfParseCallbackUrl,
  buildPdfParseWorkerConfig,
  type PdfParseWorkerConfig,
  validatePdfParseWorkerConfig,
} from "./config.js";
import {
  CliParserExecutor,
  type CliParserExecutorOptions,
} from "./parser-executor.js";
import { PdfParseProcessor } from "./pdf-parse.processor.js";
import { S3PdfStorageClient } from "./storage.js";

const config = buildPdfParseWorkerConfig();
validatePdfParseWorkerConfig(config);

const parserExecutor = createParserExecutor(config);

const workerOptions: WorkerHostOptions<PdfParseJobData> = {
  queueName: config.queueName,
  connection: config.connection,
  concurrency: config.concurrency,
  timeoutMs: config.timeoutMs,
  keepFailedTemp: config.keepFailedTemp,
  callbackUrl: (job) => {
    const jobId = readCallbackJobId(job.data, job.id);
    return buildPdfParseCallbackUrl(config.callbackBaseUrl, jobId);
  },
  callbackClient: new HttpCallbackClient({ token: config.callbackToken }),
  processor: new PdfParseProcessor({
    storageClient: new S3PdfStorageClient(config.s3),
    parserExecutor,
  }),
};

if (config.tempRoot) {
  workerOptions.tempRoot = config.tempRoot;
}

const worker = createWorkerHost<PdfParseJobData>(workerOptions);

worker.on("completed", (job) => {
  console.info("PDF parse job completed", { jobId: job.id });
});

worker.on("failed", (job, error) => {
  console.error("PDF parse job failed", {
    jobId: job?.id,
    error: error.message,
  });
});

const shutdown = async () => {
  await worker.close();
};

process.on("SIGTERM", () => {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("PDF parser worker shutdown failed", error);
      process.exit(1);
    });
});

process.on("SIGINT", () => {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("PDF parser worker shutdown failed", error);
      process.exit(1);
    });
});

function createParserExecutor(config: PdfParseWorkerConfig): CliParserExecutor {
  const options: CliParserExecutorOptions = {
    command: config.cliCommand,
    args: config.cliArgs,
  };

  if (config.cliCwd) {
    options.cwd = config.cliCwd;
  }

  return new CliParserExecutor(options);
}

function readCallbackJobId(
  data: PdfParseJobData,
  bullJobId: string | undefined,
): string {
  if (typeof data.jobId === "string") {
    return data.jobId;
  }

  return bullJobId ?? "unknown-job";
}
