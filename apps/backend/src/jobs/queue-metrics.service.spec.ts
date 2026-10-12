import { register } from 'prom-client';
import type { Queue } from 'bullmq';
import { QueueMetricsService } from './queue-metrics.service';

describe('queue metrics', () => {
  afterEach(() => register.clear());
  it('exports retained counts and removes stale values when Redis fails', async () => {
    const queue = {
      name: 'test',
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 4, failed: 2 }),
      getWorkers: jest.fn().mockResolvedValue([{}]),
    };
    const service = new QueueMetricsService(
      queue as unknown as Queue,
      queue as unknown as Queue,
    );
    await service.collect();
    expect(await register.metrics()).toContain(
      'umtas_queue_jobs{queue="test",state="waiting"} 4',
    );
    queue.getJobCounts.mockRejectedValue(new Error('Redis down'));
    await service.collect();
    const metrics = await register.metrics();
    expect(metrics).toContain('umtas_queue_scrape_success{queue="test"} 0');
    expect(metrics).not.toContain('state="waiting"');
  });
});
