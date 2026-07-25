import {
  HttpCallbackClient,
  createWorkerHost,
  parseRedisUrl,
  type WorkerHostOptions,
} from "bullmq-worker-core";
import type { TimetableSolveJobData } from "shared-types";
import { HttpSolverInputClient } from "./input-client.js";
import {
  CliSolverExecutor,
  type CliSolverExecutorOptions,
} from "./solver-executor.js";
import { SolverProcessor } from "./solver.processor.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const queueName = process.env.SOLVER_QUEUE_NAME ?? "timetable.solve";
const concurrency = Number(process.env.SOLVER_CONCURRENCY ?? 1);
const timeoutMs = Number(process.env.SOLVER_TIMEOUT_MS ?? 300_000);
const backendUrl = process.env.WORKER_BACKEND_URL ?? "http://localhost:3000";
const callbackToken = requiredEnv("WORKER_CALLBACK_TOKEN");
const keepFailedTemp = process.env.WORKER_KEEP_FAILED_TEMP === "true";
const tempRoot = process.env.WORKER_TEMP_ROOT;
const cliCommand = process.env.SOLVER_CLI_COMMAND ?? "solver-cli";
const cliArgs = process.env.SOLVER_CLI_ARGS?.trim().split(/\s+/u) ?? [];
const cliCwd = process.env.SOLVER_CLI_CWD;

const solverExecutorOptions: CliSolverExecutorOptions = {
  command: cliCommand,
  args: cliArgs,
};
if (cliCwd) solverExecutorOptions.cwd = cliCwd;

const workerOptions: WorkerHostOptions<TimetableSolveJobData> = {
  queueName,
  connection: parseRedisUrl(redisUrl),
  concurrency,
  timeoutMs,
  keepFailedTemp,
  callbackUrl: (job) =>
    buildSolverCallbackUrl(backendUrl, job.data.jobId, job.data.attemptToken),
  callbackClient: new HttpCallbackClient({ token: callbackToken }),
  processor: new SolverProcessor({
    inputClient: new HttpSolverInputClient({
      token: callbackToken,
      buildUrl: (jobId) => buildSolverInputUrl(backendUrl, jobId),
    }),
    solverExecutor: new CliSolverExecutor(solverExecutorOptions),
  }),
};
if (tempRoot) workerOptions.tempRoot = tempRoot;

const worker = createWorkerHost(workerOptions);

worker.on("completed", (job) => {
  console.info("Solver job completed", { jobId: job.id });
});
worker.on("failed", (job, error) => {
  console.error("Solver job failed", { jobId: job?.id, error: error.message });
});

process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

function handleShutdown(): void {
  worker
    .close()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Solver worker shutdown failed", error);
      process.exit(1);
    });
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function solverJobsUrl(backendUrl: string): string {
  return `${backendUrl.replace(/\/+$/u, "")}/solver/jobs`;
}

function buildSolverInputUrl(backendUrl: string, jobId: string): string {
  return `${solverJobsUrl(backendUrl)}/${encodeURIComponent(jobId)}/input`;
}

function buildSolverCallbackUrl(
  backendUrl: string,
  jobId: string,
  attemptToken: string,
): string {
  return `${solverJobsUrl(backendUrl)}/${encodeURIComponent(jobId)}/callback?attemptToken=${encodeURIComponent(attemptToken)}`;
}
