import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import type { RedisOptions } from 'ioredis';
import {
  PDF_PARSE_QUEUE_TOKEN,
  TIMETABLE_SOLVE_QUEUE_TOKEN,
} from './queue.constants';
import { QueueProducerService } from './queue-producer.service';
import { WorkerCallbackAuthGuard } from './worker-callback-auth.guard';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const pdfParseQueueName =
  process.env.PDF_PARSE_QUEUE_NAME ?? PDF_PARSE_QUEUE_TOKEN;
const pdfParseAttempts = Number(process.env.PDF_PARSE_QUEUE_ATTEMPTS ?? 3);
const pdfParseBackoffDelayMs = Number(
  process.env.PDF_PARSE_QUEUE_BACKOFF_DELAY_MS ?? 5_000,
);
const timetableSolveQueueName =
  process.env.SOLVER_QUEUE_NAME ?? TIMETABLE_SOLVE_QUEUE_TOKEN;
const timetableSolveAttempts = Number(process.env.SOLVER_QUEUE_ATTEMPTS ?? 2);
const timetableSolveBackoffDelayMs = Number(
  process.env.SOLVER_QUEUE_BACKOFF_DELAY_MS ?? 10_000,
);

const connection = redisOptionsFromUrl(redisUrl);
const removeOnComplete = { age: 86_400, count: 1_000 };
const removeOnFail = { age: 604_800, count: 5_000 };

@Module({
  imports: [
    BullModule.forRoot({
      connection,
    }),
    BullModule.registerQueue(
      {
        name: pdfParseQueueName,
        defaultJobOptions: {
          attempts: pdfParseAttempts,
          backoff: {
            type: 'exponential',
            delay: pdfParseBackoffDelayMs,
          },
          removeOnComplete,
          removeOnFail,
        },
      },
      {
        name: timetableSolveQueueName,
        defaultJobOptions: {
          attempts: timetableSolveAttempts,
          backoff: {
            type: 'exponential',
            delay: timetableSolveBackoffDelayMs,
          },
          removeOnComplete,
          removeOnFail,
        },
      },
    ),
  ],
  providers: [QueueProducerService, WorkerCallbackAuthGuard],
  exports: [QueueProducerService, WorkerCallbackAuthGuard],
})
export class JobsModule {}

function redisOptionsFromUrl(redisUrl: string): RedisOptions {
  const url = new URL(redisUrl);
  const db = url.pathname.slice(1);
  const connection: RedisOptions = {
    host: url.hostname,
    port: Number(url.port || 6379),
    maxRetriesPerRequest: null,
  };

  if (url.username) connection.username = decodeURIComponent(url.username);
  if (url.password) connection.password = decodeURIComponent(url.password);
  if (db) connection.db = Number(db);
  if (url.protocol === 'rediss:') connection.tls = {};

  return connection;
}
