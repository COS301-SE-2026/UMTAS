import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Gauge } from 'prom-client';
import {
  PDF_PARSE_QUEUE_TOKEN,
  TIMETABLE_SOLVE_QUEUE_TOKEN,
} from './queue.constants';

@Injectable()
export class QueueMetricsService {
  private readonly jobs = new Gauge({
    name: 'umtas_queue_jobs',
    help: 'Retained BullMQ job counts. Completed/failed are gauges, not lifetime counters',
    labelNames: ['queue', 'state'],
  });
  private readonly workers = new Gauge({
    name: 'umtas_queue_workers',
    help: 'Workers registered with BullMQ (not proof of successful processing)',
    labelNames: ['queue'],
  });
  private readonly success = new Gauge({
    name: 'umtas_queue_scrape_success',
    help: 'Whether the latest queue snapshot succeeded',
    labelNames: ['queue'],
  });
  private collection?: Promise<void>;

  constructor(
    @InjectQueue(PDF_PARSE_QUEUE_TOKEN) private readonly pdf: Queue,
    @InjectQueue(TIMETABLE_SOLVE_QUEUE_TOKEN) private readonly solver: Queue,
  ) {}

  collect(): Promise<void> {
    // Share concurrent scrapes and bound Redis failures below Prometheus's timeout.
    this.collection ??= this.snapshot().finally(() => {
      this.collection = undefined;
    });
    return this.collection;
  }

  private async snapshot(): Promise<void> {
    await Promise.all(
      [this.pdf, this.solver].map(async (queue) => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const [counts, workers] = await Promise.race([
            Promise.all([
              queue.getJobCounts(
                'waiting',
                'active',
                'delayed',
                'completed',
                'failed',
                'paused',
              ),
              queue.getWorkers(),
            ]),
            new Promise<never>((_, reject) => {
              timeout = setTimeout(
                () => reject(new Error('Queue metrics timeout')),
                3000,
              );
            }),
          ]);
          for (const [state, count] of Object.entries(counts)) {
            this.jobs.set({ queue: queue.name, state }, count);
          }
          this.workers.set({ queue: queue.name }, workers.length);
          this.success.set({ queue: queue.name }, 1);
        } catch {
          // Remove stale values. Redis failure must not look like an empty healthy queue.
          for (const state of [
            'waiting',
            'active',
            'delayed',
            'completed',
            'failed',
            'paused',
          ]) {
            this.jobs.remove(queue.name, state);
          }
          this.workers.remove(queue.name);
          this.success.set({ queue: queue.name }, 0);
        } finally {
          if (timeout) clearTimeout(timeout);
        }
      }),
    );
  }
}
