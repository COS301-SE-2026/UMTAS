import { S3Client } from '@aws-sdk/client-s3';
import { drizzle } from 'drizzle-orm/node-postgres';
import Redis from 'ioredis';
import { Pool } from 'pg';
import * as schema from '../../../src/entities';
import { resetIntegrationEnvironment } from '../../integration-runner/reset';
import type { FlowRuntime } from './contracts';
import {
  createFetchHttpTransport,
  HttpTestClient,
  TestActor,
} from './http-test-client';

const DEFAULT_BACKEND_URL = 'http://backend:3000';

export type IntegrationHarness = FlowRuntime & {
  readonly objectStore: S3Client;
  close(): Promise<void>;
};

export function createIntegrationHarness(): IntegrationHarness {
  const backendUrl = integrationApiUrl(
    process.env.FULL_STACK_BACKEND_URL ?? DEFAULT_BACKEND_URL,
  );
  const pool = new Pool({
    connectionString: requiredEnv('DATABASE_URL'),
  });
  const redis = new Redis(requiredEnv('REDIS_URL'));
  const objectStore = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://minio:9000',
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv('MINIO_ROOT_USER'),
      secretAccessKey: requiredEnv('MINIO_ROOT_PASSWORD'),
    },
  });
  const database = drizzle(pool, { schema });
  const http = new HttpTestClient(createFetchHttpTransport(backendUrl));
  let closed = false;

  return {
    database,
    objectStore,
    createActor(name) {
      return new TestActor(name, http.fork());
    },
    async reset() {
      await resetIntegrationEnvironment({
        database: pool,
        redis,
        objectStore,
      });
    },
    async close() {
      if (closed) return;
      closed = true;
      objectStore.destroy();
      const results = await Promise.allSettled([pool.end(), redis.quit()]);
      const failures: unknown[] = results.flatMap((result) =>
        result.status === 'rejected' ? [result.reason as unknown] : [],
      );
      if (failures.length > 0) {
        throw new AggregateError(
          failures,
          'Could not close integration harness',
        );
      }
    },
  };
}

function integrationApiUrl(backendUrl: string): string {
  const url = new URL(backendUrl);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  if (pathSegments.at(-1) !== 'api') pathSegments.push('api');
  url.pathname = `/${pathSegments.join('/')}/`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for integration tests.`);
  }
  return value;
}
