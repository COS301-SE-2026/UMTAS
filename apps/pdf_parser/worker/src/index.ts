import { writeFile } from "node:fs/promises";
import {
  HttpCallbackClient,
  createWorkerHost,
  parseRedisUrl,
  type WorkerHostOptions,
} from "bullmq-worker-core";
import type { PdfParseJobData } from "shared-types";
import {
  CliParserExecutor,
  type CliParserExecutorOptions,
} from "./parser-executor.js";
import { PdfParseProcessor } from "./pdf-parse.processor.js";
import { S3PdfStorageClient, type S3StorageClientOptions } from "./storage.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const queueName = process.env.PDF_PARSE_QUEUE_NAME ?? "pdf.parse";
const concurrency = Number(process.env.PDF_PARSE_CONCURRENCY ?? 2);
const timeoutMs = Number(process.env.PDF_PARSE_TIMEOUT_MS ?? 60_000);
const backendUrl = process.env.WORKER_BACKEND_URL ?? "http://localhost:3000";
const callbackToken = requiredEnv("WORKER_CALLBACK_TOKEN");
const keepFailedTemp = process.env.WORKER_KEEP_FAILED_TEMP === "true";
const tempRoot = process.env.WORKER_TEMP_ROOT;
const cliCommand = process.env.PDF_PARSE_CLI_COMMAND ?? "python3";
const cliArgsEnv = process.env.PDF_PARSE_CLI_ARGS;
const cliArgs =
  cliArgsEnv === undefined
    ? ["-m", "parser_cli"]
    : cliArgsEnv.trim()
      ? cliArgsEnv.trim().split(/\s+/u)
      : [];
const cliCwd = process.env.PDF_PARSE_CLI_CWD;
const storageOptions = buildStorageOptions();

const parserOptions: CliParserExecutorOptions = {
  command: cliCommand,
  args: cliArgs,
};
if (cliCwd) parserOptions.cwd = cliCwd;

const workerOptions: WorkerHostOptions<PdfParseJobData> = {
  queueName,
  connection: parseRedisUrl(redisUrl),
  concurrency,
  timeoutMs,
  keepFailedTemp,
  callbackUrl: (job) =>
    buildPdfParseCallbackUrl(backendUrl, readCallbackJobId(job.data, job.id)),
  callbackClient: new HttpCallbackClient({ token: callbackToken }),
  processor: new PdfParseProcessor({
    storageClient: new S3PdfStorageClient(storageOptions),
    parserExecutor: new CliParserExecutor(parserOptions),
  }),
};
if (tempRoot) workerOptions.tempRoot = tempRoot;

const worker = createWorkerHost<PdfParseJobData>(workerOptions);
void markWorkerReady();

worker.on("completed", (job) => {
  console.info("PDF parse job completed", { jobId: job.id });
});

worker.on("failed", (job, error) => {
  console.error("PDF parse job failed", {
    jobId: job?.id,
    queueName: job?.queueName,
    data: job?.data,
    attemptsMade: job?.attemptsMade,
    errorName: error?.name,
    errorMessage: error?.message,
    errorStack: error?.stack,
    backendUrl,
    callbackToken: "***redacted***",
    endpointReachable: storageOptions.endpoint,
  });
});

process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

async function markWorkerReady(): Promise<void> {
  await worker.waitUntilReady();
  const readyFile = process.env.WORKER_READY_FILE;
  if (readyFile) {
    await writeFile(readyFile, "ready\n");
  }
  console.info("PDF parser worker ready", { queueName });
}

function handleShutdown(): void {
  worker
    .close()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("PDF parser worker shutdown failed", error);
      process.exit(1);
    });
}

function buildStorageOptions(): S3StorageClientOptions {
  const options: S3StorageClientOptions = {
    bucket: process.env.MINIO_BUCKET ?? "umtas-uploads",
  };

  if (process.env.MINIO_ENDPOINT) options.endpoint = process.env.MINIO_ENDPOINT;
  if (process.env.MINIO_ROOT_USER) {
    options.accessKeyId = process.env.MINIO_ROOT_USER;
  }
  if (process.env.MINIO_ROOT_PASSWORD) {
    options.secretAccessKey = process.env.MINIO_ROOT_PASSWORD;
  }

  return options;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function readCallbackJobId(
  data: PdfParseJobData,
  bullJobId: string | undefined,
): string {
  return typeof data.jobId === "string"
    ? data.jobId
    : (bullJobId ?? "unknown-job");
}

function buildPdfParseCallbackUrl(backendUrl: string, jobId: string): string {
  return `${backendUrl.replace(/\/+$/u, "")}/pdf-parser/jobs/${encodeURIComponent(jobId)}/callback`;
}
