import { getReviewCounts } from "@trellala/core";
import { apiError, handleApiError, ok } from "@/lib/api-response";
import { getSessionUser } from "@/server/auth";

/** Session-authenticated; polled by the review banner. */
export async function GET() {
  try {
    if (!(await getSessionUser())) return apiError(401, "unauthorized", "Not signed in");
    return ok(await getReviewCounts());
  } catch (e) {
    return handleApiError(e);
  }
}
