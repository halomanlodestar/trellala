import { listSearchIndex } from "@trellala/core";
import { apiError, handleApiError, ok } from "@/lib/api-response";
import { getSessionUser } from "@/server/auth";

/** Session-authenticated; feeds the ⌘K command palette. */
export async function GET() {
  try {
    if (!(await getSessionUser())) return apiError(401, "unauthorized", "Not signed in");
    return ok(await listSearchIndex());
  } catch (e) {
    return handleApiError(e);
  }
}
