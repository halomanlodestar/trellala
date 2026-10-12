import { Queue, UnrecoverableError, Worker } from "bullmq";
import {
  listStaleQueuedEvents,
  loadEnv,
  markIngestFailed,
  processIngestEvent,
  runArchiveSweep,
  workerEnvSchema,
} from "@trellala/core";
import { ingestJobSchema } from "@trellala/core/schemas";
import { INGEST_JOB_OPTIONS, JOBS, QUEUES, redisConnection, type IngestJobData } from "@trellala/queue";

const env = loadEnv(workerEnvSchema);
const connection = redisConnection(env.REDIS_URL);
const SWEEP_EVERY_MS = 15 * 60 * 1000;
const REQUEUE_EVERY_MS = 60 * 1000;
const STALE_QUEUED_MS = 30 * 1000;

const ingestQueue = new Queue<IngestJobData>(QUEUES.ingest, { connection });
const maintenanceQueue = new Queue(QUEUES.maintenance, { connection });

// One job at a time: no races between sources writing to the same hackathon.
const ingestWorker = new Worker<IngestJobData>(
  QUEUES.ingest,
  async (job) => {
    const parsed = ingestJobSchema.safeParse(job.data);
    if (!parsed.success) throw new UnrecoverableError("Invalid job payload");
    return processIngestEvent(parsed.data.eventId);
  },
  { connection, concurrency: 1 },
);

ingestWorker.on("failed", async (job, err) => {
  if (!job) return;
  const final = err instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);
  console.error(`[ingest] ${job.data.eventId} attempt ${job.attemptsMade} failed: ${err.message}`);
  if (final) await markIngestFailed(job.data.eventId, err.message).catch((e) => console.error("[ingest] markFailed", e));
});

ingestWorker.on("completed", (job, result) => {
  console.log(`[ingest] ${job.data.eventId} → ${JSON.stringify(result)}`);
});

/** Re-enqueues events left QUEUED (e.g. Redis was down when the API stored them). */
async function requeueStale() {
  const ids = await listStaleQueuedEvents(STALE_QUEUED_MS);
  let requeued = 0;
  for (const eventId of ids) {
    const existing = await ingestQueue.getJob(eventId);
    const state = existing ? await existing.getState() : null;
    if (state === "waiting" || state === "active" || state === "delayed" || state === "prioritized") continue;
    if (existing) await existing.remove().catch(() => undefined);
    await ingestQueue.add(JOBS.ingestEvent, { eventId }, { ...INGEST_JOB_OPTIONS, jobId: eventId });
    requeued++;
  }
  return requeued;
}

const maintenanceWorker = new Worker(
  QUEUES.maintenance,
  async (job) => {
    if (job.name === JOBS.requeueStale) return { requeued: await requeueStale() };
    return runArchiveSweep();
  },
  { connection, concurrency: 1 },
);

maintenanceWorker.on("completed", (job, result) => {
  // Stay quiet when the minutely requeue finds nothing.
  if (job.name === JOBS.requeueStale && (result as { requeued: number }).requeued === 0) return;
  console.log(`[${job.name}] ${JSON.stringify(result)}`);
});
maintenanceWorker.on("failed", (job, err) => console.error(`[${job?.name ?? "maintenance"}] failed: ${err.message}`));

await maintenanceQueue.upsertJobScheduler("archive-sweep", { every: SWEEP_EVERY_MS }, { name: JOBS.archiveSweep });
await maintenanceQueue.upsertJobScheduler("requeue-stale", { every: REQUEUE_EVERY_MS }, { name: JOBS.requeueStale, opts: { removeOnComplete: true, removeOnFail: 100 } });
// Run both once at boot, so anything missed while the worker was down is handled.
await maintenanceQueue.add(JOBS.archiveSweep, {}, { removeOnComplete: true, removeOnFail: 100 });
await maintenanceQueue.add(JOBS.requeueStale, {}, { removeOnComplete: true, removeOnFail: 100 });

console.log("[worker] ready");

async function shutdown(signal: string) {
  console.log(`[worker] ${signal}, closing`);
  await Promise.allSettled([ingestWorker.close(), maintenanceWorker.close()]);
  await Promise.allSettled([ingestQueue.close(), maintenanceQueue.close()]);
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
