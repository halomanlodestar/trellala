import { listActivity } from "@trellala/core";
import { activityFilterSchema } from "@trellala/core/schemas";
import { apiError, handleApiError, ok, zodError } from "@/lib/api-response";
import { getSessionUser } from "@/server/auth";

/** Session-authenticated; paged activity feed for infinite scrolling. */
export async function GET(req: Request) {
  try {
    if (!(await getSessionUser())) return apiError(401, "unauthorized", "Not signed in");
    const parsed = activityFilterSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
    if (!parsed.success) return zodError(parsed.error);
    return ok(await listActivity(parsed.data));
  } catch (e) {
    return handleApiError(e);
  }
}
