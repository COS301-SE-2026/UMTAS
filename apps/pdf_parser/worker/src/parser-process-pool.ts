import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import { WorkerExecutionError, type WorkerLogger } from "bullmq-worker-core";
import type { PdfParserResult } from "shared-types";
import type { ParserExecutor, PdfParseRequest } from "./contracts.js";
import { validatePdfParserResult } from "./validation.js";

export interface ParserProcessPoolOptions {
  size: number;
  command: string;
  args: string[];
  cwd?: string;
  maxJobsPerProcess: number;
  logger?: WorkerLogger;
}

interface ParserWorkerCompletedResponse {
  requestId: string;
  status: "completed";
  result: unknown;
}

interface ParserWorkerFailedResponse {
  requestId: string;
  status: "failed";
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

type ParserWorkerResponse =
  | ParserWorkerCompletedResponse
  | ParserWorkerFailedResponse;

interface PendingParse {
  request: PdfParseRequest;
  resolve: (result: PdfParserResult) => void;
  reject: (error: unknown) => void;
  removeAbortListener?: () => void;
}

interface ParserChild {
  id: number;
  child: ChildProcessWithoutNullStreams;
  stdout: Interface;
  current: PendingParse | undefined;
  jobsProcessed: number;
  closing: boolean;
}

export class ParserProcessPool implements ParserExecutor {
  private readonly children: ParserChild[] = [];
  private readonly queue: PendingParse[] = [];
  private readonly size: number;
  private readonly command: string;
  private readonly args: string[];
  private readonly cwd: string | undefined;
  private readonly maxJobsPerProcess: number;
  private readonly logger: WorkerLogger | undefined;
  private nextChildId = 1;
  private closed = false;

  constructor(options: ParserProcessPoolOptions) {
    this.size = Math.max(1, options.size);
    this.command = options.command;
    this.args = options.args;
    this.cwd = options.cwd;
    this.maxJobsPerProcess = Math.max(1, options.maxJobsPerProcess);
    this.logger = options.logger;

    for (let index = 0; index < this.size; index += 1) {
      this.startChild();
    }
  }

  async parsePdf(request: PdfParseRequest): Promise<PdfParserResult> {
    if (this.closed) {
      throw new WorkerExecutionError(
        "PARSER_POOL_CLOSED",
        "Parser process pool is closed.",
      );
    }

    return new Promise((resolve, reject) => {
      const pending: PendingParse = { request, resolve, reject };
      pending.removeAbortListener = this.addAbortListener(pending);
      this.queue.push(pending);
      this.dispatch();
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    const pendingError = new WorkerExecutionError(
      "PARSER_POOL_CLOSED",
      "Parser process pool is closed.",
    );
    for (const pending of this.queue.splice(0)) {
      pending.removeAbortListener?.();
      pending.reject(pendingError);
    }

    const children = this.children.splice(0);
    await Promise.all(children.map((child) => this.closeChild(child)));
  }

  private startChild(): ParserChild {
    const child = spawn(this.command, this.args, {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const parserChild: ParserChild = {
      id: this.nextChildId,
      child,
      stdout: createInterface({ input: child.stdout }),
      current: undefined,
      jobsProcessed: 0,
      closing: false,
    };

    this.nextChildId += 1;
    this.children.push(parserChild);

    parserChild.stdout.on("line", (line) => this.handleLine(parserChild, line));
    child.stderr.on("data", (chunk: Buffer) => {
      this.logger?.debug("Parser worker stderr", {
        childId: parserChild.id,
        stderr: chunk.toString("utf8"),
      });
    });
    child.on("error", (error) => {
      this.restartChild(parserChild, error);
    });
    child.on("close", (exitCode, signal) => {
      if (!parserChild.closing) {
        this.restartChild(
          parserChild,
          new WorkerExecutionError(
            "PARSER_PROCESS_EXITED",
            "Parser worker process exited.",
            {
              exitCode,
              signal,
            },
          ),
        );
      }
    });

    this.dispatch();
    return parserChild;
  }

  private handleLine(child: ParserChild, line: string): void {
    const pending = child.current;
    if (!pending) {
      this.restartChild(
        child,
        new WorkerExecutionError(
          "PARSER_PROTOCOL_ERROR",
          "Parser worker emitted an unexpected response.",
          { line },
        ),
      );
      return;
    }

    let response: unknown;
    try {
      response = JSON.parse(line);
    } catch (error) {
      this.restartChild(
        child,
        new WorkerExecutionError(
          "PARSER_PROTOCOL_ERROR",
          "Parser worker emitted invalid JSON.",
          {
            line,
            parseError: error instanceof Error ? error.message : error,
          },
        ),
      );
      return;
    }

    if (!isParserWorkerResponse(response)) {
      this.restartChild(
        child,
        new WorkerExecutionError(
          "PARSER_PROTOCOL_ERROR",
          "Parser worker response payload was invalid.",
          { response },
        ),
      );
      return;
    }

    if (response.requestId !== pending.request.requestId) {
      this.restartChild(
        child,
        new WorkerExecutionError(
          "PARSER_PROTOCOL_ERROR",
          "Parser worker response requestId did not match the active request.",
          {
            expectedRequestId: pending.request.requestId,
            actualRequestId: response.requestId,
          },
        ),
      );
      return;
    }

    child.current = undefined;
    child.jobsProcessed += 1;
    pending.removeAbortListener?.();

    if (response.status === "completed") {
      try {
        pending.resolve(validatePdfParserResult(response.result));
      } catch (error) {
        pending.reject(error);
      }
    } else if (response.status === "failed") {
      const errorDetails = buildParserWorkerErrorDetails(response.error);
      pending.reject(
        new WorkerExecutionError(
          response.error.code,
          response.error.message,
          errorDetails,
        ),
      );
    } else {
      pending.reject(
        new WorkerExecutionError(
          "PARSER_PROTOCOL_ERROR",
          "Parser worker response status was unsupported.",
          { response },
        ),
      );
    }

    if (child.jobsProcessed >= this.maxJobsPerProcess) {
      this.restartChild(child);
    } else {
      this.dispatch();
    }
  }

  private dispatch(): void {
    if (this.closed) {
      return;
    }

    for (const child of this.children) {
      if (child.current || child.closing) {
        continue;
      }

      const pending = this.queue.shift();
      if (!pending) {
        return;
      }

      child.current = pending;
      child.child.stdin.write(
        `${JSON.stringify({
          requestId: pending.request.requestId,
          adapterKey: pending.request.adapterKey,
          filePath: pending.request.filePath,
        })}\n`,
      );
    }
  }

  private restartChild(child: ParserChild, error?: unknown): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }

    child.closing = true;
    child.stdout.close();
    child.child.kill("SIGKILL");

    if (child.current) {
      child.current.removeAbortListener?.();
      child.current.reject(
        error ??
          new WorkerExecutionError(
            "PARSER_RESTARTED",
            "Parser worker was restarted.",
          ),
      );
      child.current = undefined;
    }

    if (!this.closed) {
      this.startChild();
    }
  }

  private removeQueued(pending: PendingParse): void {
    const index = this.queue.indexOf(pending);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
    pending.removeAbortListener?.();
  }

  private addAbortListener(pending: PendingParse): () => void {
    const onAbort = () => this.abortPendingParse(pending);

    pending.request.abortSignal.addEventListener("abort", onAbort, {
      once: true,
    });

    return () => {
      pending.request.abortSignal.removeEventListener("abort", onAbort);
    };
  }

  private abortPendingParse(pending: PendingParse): void {
    this.removeQueued(pending);

    const child = this.findChildProcessing(pending);
    const error = new WorkerExecutionError(
      "PARSER_TIMEOUT",
      "PDF parser request was aborted.",
    );

    if (child) {
      this.restartChild(child, error);
      return;
    }

    pending.reject(error);
  }

  private findChildProcessing(pending: PendingParse): ParserChild | undefined {
    return this.children.find((child) => child.current === pending);
  }

  private closeChild(child: ParserChild): Promise<void> {
    return new Promise((resolve) => {
      let exited = false;
      child.closing = true;
      child.stdout.close();
      child.child.once("close", () => {
        exited = true;
        resolve();
      });
      child.child.kill("SIGTERM");

      setTimeout(() => {
        if (!exited) {
          child.child.kill("SIGKILL");
        }
      }, 1_000).unref();
    });
  }
}

function isParserWorkerResponse(value: unknown): value is ParserWorkerResponse {
  if (!isRecord(value) || typeof value.requestId !== "string") {
    return false;
  }

  if (value.status === "completed") {
    return Object.hasOwn(value, "result");
  }

  if (value.status === "failed") {
    return isParserWorkerError(value.error);
  }

  return false;
}

function isParserWorkerError(
  value: unknown,
): value is ParserWorkerFailedResponse["error"] {
  if (
    !isRecord(value) ||
    typeof value.code !== "string" ||
    typeof value.message !== "string"
  ) {
    return false;
  }

  return value.details === undefined || isRecord(value.details);
}

function buildParserWorkerErrorDetails(
  error: ParserWorkerFailedResponse["error"],
): Record<string, unknown> {
  const details: Record<string, unknown> = {};

  if (!error.details) {
    return details;
  }

  for (const key of Object.keys(error.details)) {
    details[key] = error.details[key];
  }

  return details;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
