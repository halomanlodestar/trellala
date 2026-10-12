import "server-only";
import * as core from "@trellala/core";
import { notFound } from "next/navigation";
import { getSessionUser, requireUser } from "../auth";

export async function loadReviewCounts() {
  const user = await getSessionUser();
  return user ? core.getReviewCounts() : { conflicts: 0, failed: 0 };
}

export async function loadReview() {
  await requireUser();
  const [conflicts, failed] = await Promise.all([core.listOpenConflicts(), core.listFailedIngests()]);
  return { conflicts, failed };
}

export async function loadConflict(id: string) {
  await requireUser();
  const c = await core.getConflict(id);
  if (!c) notFound();
  return c;
}

export async function loadIngestEvent(id: string) {
  await requireUser();
  const e = await core.getIngestEvent(id);
  if (!e) notFound();
  return e;
}
