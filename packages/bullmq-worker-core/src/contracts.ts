export interface WorkerLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export const consoleWorkerLogger: WorkerLogger = {
  debug: (message, meta) => console.debug(message, meta ?? ""),
  info: (message, meta) => console.info(message, meta ?? ""),
  warn: (message, meta) => console.warn(message, meta ?? ""),
  error: (message, meta) => console.error(message, meta ?? ""),
};

export interface WorkerCallbackError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export type WorkerCallbackPayload =
  | {
      status: "completed";
      result: unknown;
    }
  | {
      status: "failed";
      error: WorkerCallbackError;
    };

export interface WorkerJobContext<TJobData> {
  data: TJobData;
  tempDir: string;
  logger: WorkerLogger;
  abortSignal: AbortSignal;
}

export interface WorkerProcessor<TJobData> {
  process(context: WorkerJobContext<TJobData>): Promise<WorkerCallbackPayload>;
}

export interface WorkerCallbackClient {
  post(url: string, payload: WorkerCallbackPayload): Promise<void>;
}

export class WorkerExecutionError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "WorkerExecutionError";
    this.code = code;
    this.details = details;
  }
}
