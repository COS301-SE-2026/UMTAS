import {
  buildCommonWorkerConfig,
  type CommonWorkerConfig,
  type EnvReader,
} from "bullmq-worker-core";
import { z } from "zod";

export interface PdfParseWorkerConfig extends CommonWorkerConfig {
  callbackBaseUrl: string;
  cliCommand: string;
  cliArgs: string[];
  cliCwd?: string;
  s3: PdfParseS3Config;
}

export interface PdfParseS3Config {
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

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
    cliCommand: readEnv("PDF_PARSE_CLI_COMMAND") ?? "python3",
    cliArgs: readArgs(readEnv("PDF_PARSE_CLI_ARGS"), ["-m", "parser_cli"]),
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
  return `${trimTrailingSlashes(baseUrl)}/${encodeURIComponent(jobId)}/callback`;
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end -= 1;
  }

  return value.slice(0, end);
}

export function validatePdfParseWorkerConfig(
  config: PdfParseWorkerConfig,
): void {
  if (!config.s3.bucket.trim()) {
    throw new Error("MINIO_BUCKET is required.");
  }

  if (!config.callbackToken.trim()) {
    throw new Error("WORKER_CALLBACK_TOKEN is required.");
  }
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

  return splitOnWhitespace(trimmed);
}

function splitOnWhitespace(value: string): string[] {
  const args: string[] = [];
  let current = "";

  for (const character of value) {
    if (isWhitespace(character)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += character;
  }

  if (current) {
    args.push(current);
  }

  return args;
}

function isWhitespace(character: string): boolean {
  return character.trim() === "";
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
