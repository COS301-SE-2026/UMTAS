import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import type Redis from 'ioredis';
import { Queue } from 'bullmq';
import type { Pool } from 'pg';

const MAILHOG_URL = process.env.FULL_STACK_MAILHOG_URL ?? 'http://mailhog:8025';
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'umtas-uploads';
const WORKER_IDLE_TIMEOUT_MS = Number(
  process.env.INTEGRATION_WORKER_IDLE_TIMEOUT_MS ?? 30_000,
);
const QUEUE_NAMES = [
  process.env.PDF_PARSE_QUEUE_NAME ?? 'pdf.parse',
  process.env.SOLVER_QUEUE_NAME ?? 'timetable.solve',
] as const;

export type IntegrationEnvironmentResources = {
  readonly database: Pool;
  readonly redis: Redis;
  readonly objectStore: S3Client;
};

export async function resetIntegrationEnvironment(
  resources: IntegrationEnvironmentResources,
): Promise<void> {
  const queues = QUEUE_NAMES.map(
    (name) => new Queue(name, { connection: resources.redis }),
  );
  try {
    await pauseQueuesAndWaitForWorkers(queues);
    await clearDatabase(resources.database);
    await clearObjectStore(resources.objectStore);
    await clearMailHog();
    await resources.redis.flushdb();
  } finally {
    await Promise.all(
      queues.map(async (queue) => {
        try {
          await queue.resume();
        } finally {
          await queue.close();
        }
      }),
    );
  }
}

async function pauseQueuesAndWaitForWorkers(
  queues: readonly Queue[],
): Promise<void> {
  await Promise.all(queues.map((queue) => queue.pause()));
  const deadline = Date.now() + WORKER_IDLE_TIMEOUT_MS;
  while (true) {
    const activeCounts = await Promise.all(
      queues.map((queue) => queue.getActiveCount()),
    );
    if (activeCounts.every((count) => count === 0)) return;
    if (Date.now() >= deadline) {
      const active = QUEUE_NAMES.map(
        (name, index) => `${name}=${activeCounts[index]}`,
      ).join(', ');
      throw new Error(
        `Workers did not become idle within ${WORKER_IDLE_TIMEOUT_MS}ms (${active})`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function clearDatabase(database: Pool): Promise<void> {
  const result = await database.query<{ tablename: string }>(
    `SELECT tablename
       FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename`,
  );
  const tables = result.rows.map(
    ({ tablename }) => `"public".${quoteIdentifier(tablename)}`,
  );

  if (tables.length === 0) {
    throw new Error('Cannot reset integration database: no tables found.');
  }

  await database.query(
    `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`,
  );
}

async function clearObjectStore(s3: S3Client): Promise<void> {
  let continuationToken: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: MINIO_BUCKET,
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (page.Contents ?? [])
      .map(({ Key }) => Key)
      .filter((key): key is string => Boolean(key));
    await Promise.all(
      keys.map((Key) =>
        s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key })),
      ),
    );
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);
}

async function clearMailHog(): Promise<void> {
  const response = await fetch(`${MAILHOG_URL}/api/v1/messages`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `Could not clear MailHog: HTTP ${response.status} ${await response.text()}`,
    );
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
