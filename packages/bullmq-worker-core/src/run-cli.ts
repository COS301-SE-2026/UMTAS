import { execa } from "execa";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface RunCliOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

interface CliExecaOptions {
  reject: false;
  stripFinalNewline: false;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  cancelSignal?: AbortSignal;
}

interface CliExecaResult {
  exitCode?: number;
  signal?: string;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  isCanceled: boolean;
}

export async function runCli(
  command: string,
  args: string[] = [],
  options: RunCliOptions = {},
): Promise<CliResult> {
  const result = await execa(command, args, toExecaOptions(options));

  if (commandCouldNotStart(result)) {
    throw result;
  }

  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: processWasStopped(result),
  };
}

function toExecaOptions({
  cwd,
  env,
  timeoutMs,
  abortSignal,
}: RunCliOptions): CliExecaOptions {
  const options: CliExecaOptions = {
    reject: false,
    stripFinalNewline: false,
  };

  if (cwd !== undefined) {
    options.cwd = cwd;
  }

  if (env !== undefined) {
    options.env = env;
  }

  if (timeoutMs !== undefined && timeoutMs > 0) {
    options.timeout = timeoutMs;
  }

  if (abortSignal !== undefined) {
    options.cancelSignal = abortSignal;
  }

  return options;
}

function commandCouldNotStart(result: CliExecaResult): boolean {
  if (result.exitCode !== undefined) {
    return false;
  }

  if (result.signal !== undefined) {
    return false;
  }

  return !processWasStopped(result);
}

function processWasStopped(result: CliExecaResult): boolean {
  return result.timedOut || result.isCanceled;
}

export function parseCliJson<T>(result: CliResult): T {
  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error("CLI stdout was not valid JSON", { cause: error });
  }
}
