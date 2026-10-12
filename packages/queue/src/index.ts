import { Queue, type ConnectionOptions } from "bullmq";

export const QUEUES = {
  ingest: "ingest",
  maintenance: "maintenance",
} as const;

export const JOBS = {
  ingestEvent: "ingest-event",
  archiveSweep: "archive-sweep",
} as const;

export type IngestJobData = { eventId: string };

export function redisConnection(url = process.env.REDIS_URL, opts: { failFast?: boolean } = {}): ConnectionOptions {
  if (!url) throw new Error("REDIS_URL is not set");
  return opts.failFast
    ? { url, maxRetriesPerRequest: 1, enableOfflineQueue: false }
    : { url, maxRetriesPerRequest: null };
}

export const INGEST_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 5_000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

const g = globalThis as unknown as { __ingestQueue?: Queue<IngestJobData> };

/** Producer used by the web app. Fails fast if Redis is down (events stay QUEUED and the sweep re-enqueues them). */
export function getIngestQueue(): Queue<IngestJobData> {
  if (!g.__ingestQueue) {
    const queue = new Queue<IngestJobData>(QUEUES.ingest, {
      connection: redisConnection(undefined, { failFast: true }),
      skipWaitingForReady: true,
    });
    let lastLog = 0;
    queue.on("error", (e) => {
      if (Date.now() - lastLog > 60_000) console.error(`[queue] ${e.message}`);
      lastLog = Date.now();
    });
    g.__ingestQueue = queue;
  }
  return g.__ingestQueue;
}

const ENQUEUE_TIMEOUT_MS = 3_000;

/** jobId = eventId so the same event is never queued twice. Rejects within 3s if Redis is unreachable. */
export async function enqueueIngestEvents(eventIds: string[], queue: Queue<IngestJobData> = getIngestQueue()) {
  if (eventIds.length === 0) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Redis unavailable: enqueue timed out")), ENQUEUE_TIMEOUT_MS);
  });
  try {
    await Promise.race([
      queue.addBulk(eventIds.map((eventId) => ({ name: JOBS.ingestEvent, data: { eventId }, opts: { ...INGEST_JOB_OPTIONS, jobId: eventId } }))),
      timeout,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
