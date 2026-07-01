import { Worker, type Job } from "bullmq";
import {
  consoleWorkerLogger,
  WorkerExecutionError,
  type WorkerCallbackError,
  type WorkerCallbackClient,
  type WorkerCallbackPayload,
  type WorkerLogger,
  type WorkerProcessor,
} from "./contracts.js";
import {
  cleanupTempDir as defaultCleanupTempDir,
  createJobTempDir as defaultCreateJobTempDir,
} from "./temp-dir.js";

export interface WorkerJobLike<TJobData> {
  id?: string;
  name?: string;
  data: TJobData;
  attemptsMade: number;
  opts: {
    attempts?: number;
  };
}

export interface WorkerHostProcessingOptions<TJobData> {
  processor: WorkerProcessor<TJobData>;
  callbackClient: WorkerCallbackClient;
  callbackUrl: string | ((job: WorkerJobLike<TJobData>) => string);
  timeoutMs: number;
  keepFailedTemp: boolean;
  tempRoot?: string;
  logger?: WorkerLogger;
  createTempDir?: (jobId: string, rootDir?: string) => Promise<string>;
  cleanupTempDir?: (tempDir: string) => Promise<void>;
}

export interface WorkerHostOptions<
  TJobData,
> extends WorkerHostProcessingOptions<TJobData> {
  queueName: string;
  connection: object;
  concurrency: number;
}

export function createWorkerHost<TJobData>(
  options: WorkerHostOptions<TJobData>,
): Worker<TJobData> {
  return new Worker<TJobData>(
    options.queueName,
    (job: Job<TJobData>) => processWorkerJob(job, options),
    {
      connection: options.connection,
      concurrency: options.concurrency,
    },
  );
}

export async function processWorkerJob<TJobData>(
  job: WorkerJobLike<TJobData>,
  options: WorkerHostProcessingOptions<TJobData>,
): Promise<WorkerCallbackPayload> {
  const logger = options.logger ?? consoleWorkerLogger;
  const jobId = job.id ?? "unknown-job";
  const createTempDir = options.createTempDir ?? createDefaultTempDir;
  const cleanupTempDir = options.cleanupTempDir ?? defaultCleanupTempDir;
  const tempDir = await createTempDir(jobId, options.tempRoot);
  const abortController = new AbortController();
  const callbackUrl = resolveCallbackUrl(options, job);

  try {
    const payload = await withWorkerTimeout(
      options.processor.process({
        data: job.data,
        tempDir,
        logger,
        abortSignal: abortController.signal,
      }),
      options.timeoutMs,
      abortController,
    );

    await options.callbackClient.post(callbackUrl, payload);
    await cleanupTempDir(tempDir);
    return payload;
  } catch (error) {
    if (isFinalAttempt(job)) {
      await options.callbackClient.post(callbackUrl, toFailurePayload(error));
    }

    if (!options.keepFailedTemp) {
      await cleanupTempDir(tempDir);
    } else {
      logger.warn("Keeping failed worker temp directory", { jobId, tempDir });
    }

    throw error;
  }
}

export function isFinalAttempt(job: WorkerJobLike<unknown>): boolean {
  const attempts = job.opts.attempts ?? 1;
  return job.attemptsMade + 1 >= attempts;
}

export function toFailurePayload(error: unknown): WorkerCallbackPayload {
  if (error instanceof WorkerExecutionError) {
    return failurePayload({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof Error) {
    return failurePayload({
      code: "WORKER_FAILED",
      message: error.message,
      details: {},
    });
  }

  return failurePayload({
    code: "WORKER_FAILED",
    message: "Worker job failed",
    details: { error },
  });
}

function createDefaultTempDir(
  jobId: string,
  rootDir?: string,
): Promise<string> {
  if (rootDir === undefined) {
    return defaultCreateJobTempDir(jobId);
  }

  return defaultCreateJobTempDir(jobId, { rootDir });
}

async function withWorkerTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  abortController: AbortController,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          abortController.abort();
          reject(
            new WorkerExecutionError("WORKER_TIMEOUT", "Worker job timed out", {
              timeoutMs,
            }),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function failurePayload(error: WorkerCallbackError): WorkerCallbackPayload {
  return {
    status: "failed",
    error,
  };
}

function resolveCallbackUrl<TJobData>(
  options: WorkerHostProcessingOptions<TJobData>,
  job: WorkerJobLike<TJobData>,
): string {
  if (typeof options.callbackUrl === "function") {
    return options.callbackUrl(job);
  }

  return options.callbackUrl;
}
