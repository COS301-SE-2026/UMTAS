import {
  WorkerExecutionError,
  runCli,
  type CliResult,
} from "bullmq-worker-core";
import type { PdfParserResult } from "shared-types";
import type { ParserExecutor, PdfParseRequest } from "./contracts.js";
import { validatePdfParserResult } from "./validation.js";

export type RunCliFn = typeof runCli;

export interface CliParserExecutorOptions {
  command: string;
  args: string[];
  cwd?: string;
  runCliFn?: RunCliFn;
}

interface ParserErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class CliParserExecutor implements ParserExecutor {
  private readonly command: string;
  private readonly args: string[];
  private readonly cwd: string | undefined;
  private readonly runCliFn: RunCliFn;

  constructor(options: CliParserExecutorOptions) {
    this.command = options.command;
    this.args = options.args;
    this.cwd = options.cwd;
    this.runCliFn = options.runCliFn ?? runCli;
  }

  async parsePdf(request: PdfParseRequest): Promise<PdfParserResult> {
    const args = this.buildParserArgs(request);
    const options: {
      abortSignal: AbortSignal;
      cwd?: string;
    } = {
      abortSignal: request.abortSignal,
    };

    if (this.cwd) {
      options.cwd = this.cwd;
    }

    const result = await this.runCliFn(this.command, args, options);

    return parseCliParserResult(result);
  }

  private buildParserArgs(request: PdfParseRequest): string[] {
    const args = this.args.slice();
    args.push("--adapter");
    args.push(request.adapterKey);
    args.push("--file");
    args.push(request.filePath);
    return args;
  }
}

export function parseCliParserResult(result: CliResult): PdfParserResult {
  if (result.timedOut) {
    throw new WorkerExecutionError("PARSER_TIMEOUT", "PDF parser timed out.", {
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  }

  if (result.exitCode === 0) {
    const parserResult = parseParserResultJson(result.stdout, result.stderr);
    return validatePdfParserResult(parserResult);
  }

  const errorPayload = parseParserErrorJson(result.stdout, result.stderr);
  if (!isParserErrorPayload(errorPayload)) {
    throw new WorkerExecutionError(
      "PARSER_PROTOCOL_ERROR",
      "PDF parser failure payload was invalid.",
      {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      },
    );
  }

  const details = buildParserErrorDetails(errorPayload, result);
  throw new WorkerExecutionError(
    errorPayload.code,
    errorPayload.message,
    details,
  );
}

function buildParserErrorDetails(
  errorPayload: ParserErrorPayload,
  result: CliResult,
): Record<string, unknown> {
  return {
    ...errorPayload.details,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

function parseParserResultJson(stdout: string, stderr: string): unknown {
  return parseJsonFromStdout(stdout, stderr);
}

function parseParserErrorJson(
  stdout: string,
  stderr: string,
): ParserErrorPayload | unknown {
  return parseJsonFromStdout(stdout, stderr);
}

function parseJsonFromStdout(stdout: string, stderr: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new WorkerExecutionError(
      "PARSER_PROTOCOL_ERROR",
      "PDF parser stdout was not valid JSON.",
      {
        stdout,
        stderr,
        parseError: error instanceof Error ? error.message : error,
      },
    );
  }
}

function isParserErrorPayload(value: unknown): value is ParserErrorPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.code === "string" && typeof payload.message === "string"
  );
}
