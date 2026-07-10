import {
  HttpCallbackClient,
  createWorkerHost,
  type WorkerHostOptions,
} from "bullmq-worker-core";
import type { TimetableSolveJobData } from "shared-types";
import {
  buildSolverCallbackUrl,
  buildSolverInputUrl,
  buildSolverWorkerConfig,
  validateSolverWorkerConfig,
} from "./config.js";
import { HttpSolverInputClient } from "./input-client.js";
import {
  CliSolverExecutor,
  type CliSolverExecutorOptions,
} from "./solver-executor.js";
import { SolverProcessor } from "./solver.processor.js";

const config = buildSolverWorkerConfig();
validateSolverWorkerConfig(config);

const solverExecutorOptions: CliSolverExecutorOptions = {
  command: config.cliCommand,
  args: config.cliArgs,
};
if (config.cliCwd) solverExecutorOptions.cwd = config.cliCwd;

const workerOptions: WorkerHostOptions<TimetableSolveJobData> = {
  queueName: config.queueName,
  connection: config.connection,
  concurrency: config.concurrency,
  timeoutMs: config.timeoutMs,
  keepFailedTemp: config.keepFailedTemp,
  callbackUrl: (job) =>
    buildSolverCallbackUrl(config.callbackBaseUrl, job.data.jobId),
  callbackClient: new HttpCallbackClient({ token: config.callbackToken }),
  processor: new SolverProcessor({
    inputClient: new HttpSolverInputClient({
      token: config.callbackToken,
      buildUrl: (jobId) => buildSolverInputUrl(config.inputBaseUrl, jobId),
    }),
    solverExecutor: new CliSolverExecutor(solverExecutorOptions),
  }),
};
if (config.tempRoot) workerOptions.tempRoot = config.tempRoot;

const worker = createWorkerHost(workerOptions);

worker.on("completed", (job) => {
  console.info("Solver job completed", { jobId: job.id });
});
worker.on("failed", (job, error) => {
  console.error("Solver job failed", { jobId: job?.id, error: error.message });
});

async function shutdown(): Promise<void> {
  await worker.close();
}

function handleShutdown(): void {
  shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Solver worker shutdown failed", error);
      process.exit(1);
    });
}

process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);
