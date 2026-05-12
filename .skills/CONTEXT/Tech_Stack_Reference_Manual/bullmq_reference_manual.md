# BullMQ Reference Manual (v5.76.0)

## Section 0: Quick Start

Setup a simple producer and consumer for background job processing.

```typescript
// Install BullMQ
pnpm add bullmq

// Produce a job
import { Queue } from 'bullmq';
const myQueue = new Queue('Paint');
await myQueue.add('cars', { color: 'blue' });

// Consume a job
import { Worker } from 'bullmq';
const worker = new Worker('Paint', async job => {
  console.log(job.data.color);
});
```

Expected output: `blue` printed to the console when the job is processed.

## Section 1: Key Language Terms & Features

- **Queue** — The entry point for adding jobs to be processed. | `new Queue('video')` | ⚠️ Queues are persistent; ensure unique names across your application.
- **Worker** — The logic that listens for and executes jobs from a specific queue. | `new Worker('video', fn)` | ⚠️ Workers should be idempotent (safe to run multiple times) in case of retries.
- **Job** — A single unit of work containing data and metadata. | `job.data` | ⚠️ Keep job data small; store large payloads in a database and pass IDs instead.
- **Repeatable Jobs** — Jobs that run on a schedule (cron or interval). | `repeat: { cron: '0 0 * * *' }` | ⚠️ Be careful with overlapping intervals; use `jobId` to prevent duplicate schedules.
- **Delayed Jobs** — Jobs that wait for a specified time before becoming active. | `delay: 5000` | ⚠️ Delays are minimums; actual start time depends on worker availability.
- **Priority** — Allows higher-priority jobs to be processed before lower-priority ones. | `priority: 1` | ⚠️ High number = low priority (default is 0, which is highest).
- **Parent/Child (Flows)** — Complex job dependencies and sequences. | `new FlowProducer()` | ⚠️ Parent jobs only complete after all their children have finished.
- **Sandboxed Workers** — Running workers in separate processes for better isolation. | `new Worker('name', 'path/to/processor.js')` | ⚠️ Necessary for CPU-heavy tasks to prevent blocking the main event loop.
- **Events** — Global or local listeners for job completions, failures, and progress. | `worker.on('completed', ...)` | ⚠️ Local listeners only catch events for that specific worker instance.
- **Group Affinity** — (New in v5) Logic to process related jobs together for efficiency. | `group: 'user-123'` | ⚠️ Useful for batching multiple small updates into a single database transaction.
- **OpenTelemetry (OTel)** — Native tracing and metrics for monitoring job lifecycles. | `otel: true` | ⚠️ Essential for debugging distributed job flows and identifying bottlenecks.

## Section 2: Key Commands & Workflows

- `pnpm add bullmq` — Installs the library. | _Project initialization._
- `queue.add('name', data)` — Adds a new job to the queue. | _Producing work._
- `worker.on('failed', (job, err) => ...)` — Listens for job failures. | _Error handling and logging._
- `job.updateProgress(50)` — Reports the completion percentage of a job. | _User feedback and monitoring._
- `queue.getJob(id)` — Retrieves a specific job by its ID. | _Inspecting job state._
- `queue.pause()` — Temporarily stops workers from picking up new jobs. | _Maintenance and flow control._
- `queue.clean(grace, limit, type)` — Removes old jobs from Redis. | _Cleanup and memory management._
- `worker.close()` — Gracefully shuts down a worker. | _Process termination._

## Section 3: Architecture & Component Relationships

```
Producer (App Code)
       ↓
BullMQ Client (Queue)
       ↓
Redis (Data Store & Pub/Sub)
       ↓
BullMQ Client (Worker)
       ↓
Consumer Logic (Function/Script)
```

**Key Flow:** Producers add **Jobs** to a **Queue** backed by **Redis**. **Workers** subscribe to these queues via **Redis Pub/Sub** and polling, execute the logic, and update the job status back in Redis. **Events** are emitted throughout the lifecycle for monitoring.

## Section 4: Documentation Links

- [Official BullMQ Docs](https://docs.bullmq.io/) — _Comprehensive guides and API reference._
- [BullMQ Patterns](https://docs.bullmq.io/patterns) — _Common solutions for recurring problems._
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq) — _Source code and issue tracker._
- [Taskforce.sh](https://taskforce.sh/) — _Commercial UI for managing BullMQ (optional)._
- [Redis Backend Reference](https://docs.bullmq.io/guide/backend) — _Understanding how BullMQ uses Redis._
