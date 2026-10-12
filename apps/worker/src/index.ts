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
const STALE_QUEUED_MS = 2 * 60 * 1000;

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
  async () => {
    const sweep = await runArchiveSweep();
    const requeued = await requeueStale();
    return { ...sweep, requeued };
  },
  { connection, concurrency: 1 },
);

maintenanceWorker.on("completed", (_job, result) => console.log(`[sweep] ${JSON.stringify(result)}`));
maintenanceWorker.on("failed", (_job, err) => console.error(`[sweep] failed: ${err.message}`));

await maintenanceQueue.upsertJobScheduler("archive-sweep", { every: SWEEP_EVERY_MS }, { name: JOBS.archiveSweep });
// Run once at boot too, so deadlines that passed while the worker was down are handled.
await maintenanceQueue.add(JOBS.archiveSweep, {}, { removeOnComplete: true, removeOnFail: 100 });

console.log("[worker] ready");

async function shutdown(signal: string) {
  console.log(`[worker] ${signal}, closing`);
  await Promise.allSettled([ingestWorker.close(), maintenanceWorker.close()]);
  await Promise.allSettled([ingestQueue.close(), maintenanceQueue.close()]);
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
