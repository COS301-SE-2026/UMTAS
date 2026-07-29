import { spawn } from 'node:child_process';
import { chmod, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const RUNNER_DIRECTORY = __dirname;
const COMPOSE_FILE = path.join(RUNNER_DIRECTORY, 'integration.compose.yml');
const COVERAGE_DIRECTORY = path.resolve(
  RUNNER_DIRECTORY,
  '../../coverage/integration',
);
const PROJECT_NAME = `umtas-integration-${process.pid}`;

async function main(): Promise<void> {
  let failure: Error | undefined;

  try {
    await prepareCoverageDirectory();
    const exitCode = await compose([
      'up',
      '--build',
      '--abort-on-container-exit',
      '--exit-code-from',
      'test-runner',
    ]);
    if (exitCode !== 0) {
      failure = new Error(`Integration tests exited with code ${exitCode}.`);
    }
  } finally {
    const exitCode = await compose(['down', '--volumes', '--remove-orphans']);
    if (exitCode !== 0 && !failure) {
      failure = new Error(`Integration teardown exited with code ${exitCode}.`);
    }
  }

  if (failure) throw failure;
}

async function prepareCoverageDirectory(): Promise<void> {
  await rm(COVERAGE_DIRECTORY, { recursive: true, force: true });
  await mkdir(COVERAGE_DIRECTORY, { recursive: true });

  // The backend runs as the unprivileged `node` user. A permissive mode is
  // needed because its container UID can differ from the host/CI runner UID.
  await chmod(COVERAGE_DIRECTORY, 0o777);
}

function compose(args: readonly string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'compose',
        '--project-name',
        PROJECT_NAME,
        '--file',
        COMPOSE_FILE,
        '--ansi',
        'never',
        ...args,
      ],
      {
        cwd: RUNNER_DIRECTORY,
        stdio: 'inherit',
      },
    );

    child.on('error', reject);
    child.on('close', (exitCode) => resolve(exitCode ?? 1));
  });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
