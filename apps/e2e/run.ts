import { spawn, type ChildProcess } from "node:child_process";
import { chmod, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const RUNNER_DIRECTORY = __dirname;
const COMPOSE_FILE = path.join(RUNNER_DIRECTORY, "e2e.compose.yml");
const OUTPUT_DIRECTORIES = [
  path.join(RUNNER_DIRECTORY, "test-results"),
  path.join(RUNNER_DIRECTORY, "playwright-report"),
] as const;
const PROJECT_NAME = `umtas-e2e-${process.pid}`;
let activeChild: ChildProcess | undefined;
let receivedSignal: NodeJS.Signals | undefined;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    receivedSignal = signal;
    activeChild?.kill(signal);
  });
}

async function main(): Promise<void> {
  let failure: Error | undefined;

  try {
    await prepareOutputDirectories();
    const exitCode = await compose([
      "up",
      "--build",
      "--abort-on-container-exit",
      "--exit-code-from",
      "test-runner",
    ]);
    if (exitCode !== 0) {
      failure = new Error(
        receivedSignal
          ? `E2E run interrupted by ${receivedSignal}.`
          : `E2E tests exited with code ${exitCode}.`,
      );
    }
  } finally {
    const exitCode = await compose(["down", "--volumes", "--remove-orphans"]);
    if (exitCode !== 0 && !failure) {
      failure = new Error(`E2E teardown exited with code ${exitCode}.`);
    }
  }

  if (failure) throw failure;
}

async function prepareOutputDirectories(): Promise<void> {
  await Promise.all(
    OUTPUT_DIRECTORIES.map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
      await mkdir(directory, { recursive: true });

      // The Playwright image can use a different UID from the host/CI runner.
      await chmod(directory, 0o777);
    }),
  );
}

function compose(args: readonly string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "compose",
        "--project-name",
        PROJECT_NAME,
        "--file",
        COMPOSE_FILE,
        "--ansi",
        "never",
        ...args,
      ],
      {
        cwd: RUNNER_DIRECTORY,
        stdio: "inherit",
      },
    );
    activeChild = child;

    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (activeChild === child) activeChild = undefined;
      resolve(exitCode ?? 1);
    });
  });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
