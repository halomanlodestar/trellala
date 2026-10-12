import { authenticateApiKey, getIngestEventForApi } from "@trellala/core";
import { ingestEventIdSchema } from "@trellala/core/schemas";
import { apiError, bearerToken, handleApiError, ok, zodError } from "@/lib/api-response";

/** GET /api/v1/ingest/:eventId — status of an event created with this key. */
export async function GET(req: Request, ctx: RouteContext<"/api/v1/ingest/[eventId]">) {
  try {
    const apiKey = await authenticateApiKey(bearerToken(req));
    const parsed = ingestEventIdSchema.safeParse(await ctx.params);
    if (!parsed.success) return zodError(parsed.error);
    const event = await getIngestEventForApi(apiKey.id, parsed.data.eventId);
    return event ? ok(event) : apiError(404, "not_found", "Ingest event not found");
  } catch (e) {
    return handleApiError(e);
  }
}
