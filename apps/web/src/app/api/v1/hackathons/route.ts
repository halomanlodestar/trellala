import { authenticateApiKey, lookupHackathon } from "@trellala/core";
import { hackathonLookupSchema } from "@trellala/core/schemas";
import { apiError, bearerToken, handleApiError, ok, zodError } from "@/lib/api-response";

/** GET /api/v1/hackathons?externalId=…|sourceUrl=… — lookup within this key's source. */
export async function GET(req: Request) {
  try {
    const apiKey = await authenticateApiKey(bearerToken(req));
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const parsed = hackathonLookupSchema.safeParse(params);
    if (!parsed.success) return zodError(parsed.error);
    const h = await lookupHackathon(apiKey.source, parsed.data);
    return h ? ok(h) : apiError(404, "not_found", "Hackathon not found");
  } catch (e) {
    return handleApiError(e);
  }
}
