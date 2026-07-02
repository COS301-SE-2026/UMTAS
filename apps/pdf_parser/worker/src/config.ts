import {
  buildCommonWorkerConfig,
  readPositiveInt,
  type CommonWorkerConfig,
  type EnvReader,
} from "bullmq-worker-core";
import { z } from "zod";
import type { PdfParseExecutionMode } from "./contracts.js";

export interface PdfParseWorkerConfig extends CommonWorkerConfig {
  callbackBaseUrl: string;
  executionMode: PdfParseExecutionMode;
  cliCommand: string;
  cliArgs: string[];
  workerCommand: string;
  workerArgs: string[];
  cliCwd?: string;
  processPoolSize: number;
  processMaxJobs: number;
  s3: PdfParseS3Config;
}

export interface PdfParseS3Config {
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

const executionModeSchema = z.enum(["cli", "process-pool"]);
const DEFAULT_EXECUTION_MODE: PdfParseExecutionMode = "cli";
const argsSchema = z.array(z.string());

export function buildPdfParseWorkerConfig(
  readEnv: EnvReader = (key) => process.env[key],
): PdfParseWorkerConfig {
  const common = buildCommonWorkerConfig(readEnv, {
    queueNameEnv: "PDF_PARSE_QUEUE_NAME",
    defaultQueueName: "pdf.parse",
    concurrencyEnv: "PDF_PARSE_CONCURRENCY",
    defaultConcurrency: 2,
    timeoutEnv: "PDF_PARSE_TIMEOUT_MS",
    defaultTimeoutMs: 60_000,
  });
  const executionMode = readExecutionMode(readEnv("PDF_PARSE_EXECUTION_MODE"));
  const cliCwd = readEnv("PDF_PARSE_CLI_CWD");
  const callbackBaseUrl =
    readEnv("PDF_PARSE_CALLBACK_URL") ??
    "http://localhost:3000/pdf-parser/jobs";

  const config: PdfParseWorkerConfig = {
    queueName: common.queueName,
    connection: common.connection,
    concurrency: common.concurrency,
    timeoutMs: common.timeoutMs,
    keepFailedTemp: common.keepFailedTemp,
    callbackToken: common.callbackToken,
    callbackBaseUrl: callbackBaseUrl,
    executionMode: executionMode,
    cliCommand: readEnv("PDF_PARSE_CLI_COMMAND") ?? "python3",
    cliArgs: readArgs(readEnv("PDF_PARSE_CLI_ARGS"), ["-m", "parser_cli"]),
    workerCommand: readEnv("PDF_PARSE_WORKER_COMMAND") ?? "python3",
    workerArgs: readArgs(readEnv("PDF_PARSE_WORKER_ARGS"), [
      "-m",
      "parser_worker",
    ]),
    processPoolSize: readPositiveInt(readEnv("PDF_PARSE_PROCESS_POOL_SIZE"), 4),
    processMaxJobs: readPositiveInt(readEnv("PDF_PARSE_PROCESS_MAX_JOBS"), 500),
    s3: buildPdfParseS3Config(readEnv),
  };

  if (common.tempRoot) {
    config.tempRoot = common.tempRoot;
  }

  if (cliCwd) {
    config.cliCwd = cliCwd;
  }

  return config;
}

export function buildPdfParseCallbackUrl(
  baseUrl: string,
  jobId: string,
): string {
  return `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(jobId)}/callback`;
}

export function readArgs(
  value: string | undefined,
  defaultArgs: string[],
): string[] {
  if (value === undefined) {
    return defaultArgs;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new Error(
        `Parser args JSON was invalid: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const result = argsSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error("Parser args JSON must be an array of strings.");
    }
    return result.data;
  }

  return trimmed.split(/\s+/);
}

function readExecutionMode(value: string | undefined): PdfParseExecutionMode {
  const result = executionModeSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_EXECUTION_MODE;
}

function buildPdfParseS3Config(readEnv: EnvReader): PdfParseS3Config {
  const config: PdfParseS3Config = {
    bucket: readEnv("MINIO_BUCKET") ?? "",
  };

  const endpoint = readEnv("MINIO_ENDPOINT");
  if (endpoint) {
    config.endpoint = endpoint;
  }

  const accessKeyId = readEnv("MINIO_ROOT_USER");
  if (accessKeyId) {
    config.accessKeyId = accessKeyId;
  }

  const secretAccessKey = readEnv("MINIO_ROOT_PASSWORD");
  if (secretAccessKey) {
    config.secretAccessKey = secretAccessKey;
  }

  return config;
}
