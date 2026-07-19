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

import { exec } from "node:child_process";

import http from "node:http";

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
    buildSolverCallbackUrl(
      config.callbackBaseUrl,
      job.data.jobId,
      job.data.attemptToken,
    ),
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

const checkHealthPort = process.env.HEALTH_PORT; //just need to check with michael if this approach is correct

const healthServer = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    exec("preference-solver --health", (error, stdout, stderr) => {
      if (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ status: "unhealthy", details: error.message }),
        ); //changed to async so we dont block any of the bullmq threads
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "not found" }));
  }
});

healthServer.listen(checkHealthPort, () => {
  console.log(`Health check server running on: ${checkHealthPort}`);
});

worker.on("completed", (job) => {
  console.info("Solver job completed", { jobId: job.id });
});
worker.on("failed", (job, error) => {
  console.error("Solver job failed", { jobId: job?.id, error: error.message });
});

async function shutdown(): Promise<void> {
  await new Promise<void>((resolve) => {
    healthServer.close(() => resolve());
  });
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
