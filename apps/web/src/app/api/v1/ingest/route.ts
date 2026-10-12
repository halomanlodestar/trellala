import { authenticateApiKey, createIngestEvents } from "@trellala/core";
import { ingestBatchSchema, MAX_INGEST_BATCH } from "@trellala/core/schemas";
import { enqueueIngestEvents } from "@trellala/queue";
import { bearerToken, handleApiError, ok, readJson, apiError } from "@/lib/api-response";

/**
 * POST /api/v1/ingest  { hackathons: [...] }  → 202
 * Each item is stored as an IngestEvent; invalid items are stored as FAILED and reported back.
 */
export async function POST(req: Request) {
  try {
    const apiKey = await authenticateApiKey(bearerToken(req));
    const body = await readJson(req);
    const parsed = ingestBatchSchema.safeParse(body);
    if (!parsed.success) {
      const tooMany = Array.isArray((body as { hackathons?: unknown })?.hackathons) && (body as { hackathons: unknown[] }).hackathons.length > MAX_INGEST_BATCH;
      return tooMany
        ? apiError(413, "payload_too_large", `At most ${MAX_INGEST_BATCH} hackathons per request`)
        : apiError(400, "validation_failed", "Body must be { hackathons: [...] }", parsed.error.issues);
    }

    const results = await createIngestEvents(apiKey, parsed.data.hackathons);
    const queued = results.filter((r) => r.status === "queued").map((r) => r.eventId);
    // Events are already stored; if Redis is down they stay QUEUED and the worker sweep re-enqueues them.
    await enqueueIngestEvents(queued).catch((e) => console.error("[ingest] enqueue failed", e));

    return ok({ accepted: queued.length, rejected: results.length - queued.length, results }, 202);
  } catch (e) {
    return handleApiError(e);
  }
}
