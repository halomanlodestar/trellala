import "server-only";
import * as core from "@trellala/core";
import { activityFilterSchema } from "@trellala/core/schemas";
import { requireUser } from "../auth";

export async function loadActivity(raw: unknown) {
  await requireUser();
  const parsed = activityFilterSchema.safeParse(raw);
  return core.listActivity(parsed.success ? parsed.data : {});
}
