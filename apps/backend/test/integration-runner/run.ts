import { spawn } from 'node:child_process';
import { chmod, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const RUNNER_DIRECTORY = __dirname;
const COMPOSE_FILE = path.join(RUNNER_DIRECTORY, 'integration.compose.yml');
const COVERAGE_DIRECTORY = path.resolve(
  RUNNER_DIRECTORY,
  '../../coverage/integration',
);
const TEST_RESULTS_DIRECTORY = path.join(RUNNER_DIRECTORY, 'test-results');
const BACKEND_DIRECTORY = path.resolve(RUNNER_DIRECTORY, '../..');
const PROJECT_NAME = `umtas-integration-${process.pid}`;

const DB_USER = process.env.DB_USER ?? 'umtas_integration';
const DB_PASSWORD = process.env.DB_PASSWORD ?? 'integration-postgres-password';
const DB_NAME = process.env.DB_NAME ?? 'umtas_integration';
const REDIS_PASSWORD =
  process.env.REDIS_PASSWORD ?? 'integration-redis-password';
const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER ?? 'integration-minio';
const MINIO_ROOT_PASSWORD =
  process.env.MINIO_ROOT_PASSWORD ?? 'integration-minio-password';
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'umtas-uploads';

async function main(): Promise<void> {
  let failure: Error | undefined;

  try {
    await prepareCoverageDirectory();
    await prepareTestResultsDirectory();
    const exitCode = await compose([
      'up',
      ...(hasPrebuiltSharedImages() ? [] : ['--build']),
      '--wait',
    ]);
    if (exitCode !== 0) {
      failure = new Error(`Integration stack failed with code ${exitCode}.`);
    } else {
      const ports = await resolveServicePorts();
      const testExitCode = await runIntegrationTests(ports);
      if (testExitCode !== 0) {
        failure = new Error(
          `Integration tests exited with code ${testExitCode}.`,
        );
      }
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

async function prepareTestResultsDirectory(): Promise<void> {
  await rm(TEST_RESULTS_DIRECTORY, { recursive: true, force: true });
  await mkdir(TEST_RESULTS_DIRECTORY, { recursive: true });
}

type ServicePorts = {
  readonly backend: number;
  readonly postgres: number;
  readonly redis: number;
  readonly minio: number;
  readonly mailhog: number;
};

function hasPrebuiltSharedImages(): boolean {
  return Boolean(
    process.env.CI_BACKEND_IMAGE &&
    process.env.CI_PDF_PARSER_IMAGE &&
    process.env.CI_SOLVER_IMAGE,
  );
}

async function resolveServicePorts(): Promise<ServicePorts> {
  const [backend, postgres, redis, minio, mailhog] = await Promise.all([
    composePort('backend', 3000),
    composePort('postgres', 5432),
    composePort('redis', 6379),
    composePort('minio', 9000),
    composePort('mailhog', 8025),
  ]);

  return { backend, postgres, redis, minio, mailhog };
}

function composePort(service: string, port: number): Promise<number> {
  return composeOutput(['port', service, String(port)]).then((output) => {
    const match = output.trim().match(/:(\d+)\s*$/);
    if (!match) {
      throw new Error(
        `Could not resolve the published port for ${service}:${port}: ${output.trim()}`,
      );
    }
    return Number(match[1]);
  });
}

function runIntegrationTests(ports: ServicePorts): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      [
        'exec',
        'jest',
        '--config=test/integration-runner/jest.config.ts',
        '--runInBand',
      ],
      {
        cwd: BACKEND_DIRECTORY,
        env: {
          ...process.env,
          CI: '1',
          NODE_OPTIONS: '--experimental-vm-modules',
          DB_MODE: 'DATABASE',
          FULL_STACK_BACKEND_URL: `http://127.0.0.1:${ports.backend}`,
          FULL_STACK_MAILHOG_URL: `http://127.0.0.1:${ports.mailhog}`,
          DATABASE_URL: `postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${ports.postgres}/${DB_NAME}`,
          REDIS_URL: `redis://:${REDIS_PASSWORD}@127.0.0.1:${ports.redis}`,
          REDIS_PASSWORD,
          MINIO_ENDPOINT: `http://127.0.0.1:${ports.minio}`,
          MINIO_ROOT_USER,
          MINIO_ROOT_PASSWORD,
          MINIO_BUCKET,
        },
        stdio: 'inherit',
      },
    );

    child.on('error', reject);
    child.on('close', (exitCode) => resolve(exitCode ?? 1));
  });
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

function composeOutput(args: readonly string[]): Promise<string> {
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
        stdio: ['ignore', 'pipe', 'inherit'],
      },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer | string) => {
      output += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(
          new Error(
            `docker compose ${args.join(' ')} failed with code ${exitCode ?? 1}.`,
          ),
        );
        return;
      }
      resolve(output);
    });
  });
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
