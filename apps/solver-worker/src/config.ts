import {
  buildCommonWorkerConfig,
  type CommonWorkerConfig,
  type EnvReader,
} from "bullmq-worker-core";

export interface SolverWorkerConfig extends CommonWorkerConfig {
  callbackBaseUrl: string;
  inputBaseUrl: string;
  cliCommand: string;
  cliArgs: string[];
  cliCwd?: string;
}

export function buildSolverWorkerConfig(
  readEnv: EnvReader = (key) => process.env[key],
): SolverWorkerConfig {
  const common = buildCommonWorkerConfig(readEnv, {
    queueNameEnv: "TIMETABLE_SOLVE_QUEUE_NAME",
    defaultQueueName: "timetable.solve",
    concurrencyEnv: "SOLVER_CONCURRENCY",
    defaultConcurrency: 1,
    timeoutEnv: "SOLVER_TIMEOUT_MS",
    defaultTimeoutMs: 300_000,
  });
  const callbackBaseUrl =
    readEnv("SOLVER_CALLBACK_URL") ?? "http://localhost:3000/solver/jobs";
  const inputBaseUrl =
    readEnv("SOLVER_INPUT_URL") ?? "http://localhost:3000/solver/jobs";
  const config: SolverWorkerConfig = {
    queueName: common.queueName,
    connection: common.connection,
    concurrency: common.concurrency,
    timeoutMs: common.timeoutMs,
    keepFailedTemp: common.keepFailedTemp,
    callbackToken: common.callbackToken,
    callbackBaseUrl,
    inputBaseUrl,
    cliCommand: readEnv("SOLVER_CLI_COMMAND") ?? "solver-cli",
    cliArgs: readCliArgs(readEnv("SOLVER_CLI_ARGS")),
  };
  const cliCwd = readEnv("SOLVER_CLI_CWD");

  if (common.tempRoot) config.tempRoot = common.tempRoot;
  if (cliCwd) config.cliCwd = cliCwd;

  return config;
}

export function validateSolverWorkerConfig(config: SolverWorkerConfig): void {
  if (!config.callbackToken.trim()) {
    throw new Error("WORKER_CALLBACK_TOKEN is required.");
  }
}

export function buildSolverInputUrl(baseUrl: string, jobId: string): string {
  return `${trimTrailingSlashes(baseUrl)}/${encodeURIComponent(jobId)}/input`;
}

export function buildSolverCallbackUrl(
  baseUrl: string,
  jobId: string,
  attemptToken: string,
): string {
  return `${trimTrailingSlashes(baseUrl)}/${encodeURIComponent(jobId)}/callback?attemptToken=${encodeURIComponent(attemptToken)}`;
}

function readCliArgs(value: string | undefined): string[] {
  if (!value || !value.trim()) return [];
  return value.trim().split(/\s+/u);
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end -= 1;
  return value.slice(0, end);
}
