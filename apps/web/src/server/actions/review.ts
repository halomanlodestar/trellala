"use server";

import { discardIngestEvent, resolveConflict, retryIngestEvent } from "@trellala/core";
import { ingestEventActionSchema, resolveConflictSchema } from "@trellala/core/schemas";
import { enqueueIngestEvents } from "@trellala/queue";
import { runAction } from "../action";

export async function resolveConflictAction(input: unknown) {
  return runAction(resolveConflictSchema, input, (data, { actor }) => resolveConflict(actor, data));
}

export async function retryIngestEventAction(input: unknown) {
  return runAction(ingestEventActionSchema, input, async ({ eventId }, { actor }) => {
    await retryIngestEvent(actor, eventId);
    // If Redis is down the event stays QUEUED and the worker sweep picks it up.
    await enqueueIngestEvents([eventId]).catch((e) => console.error("[retry] enqueue failed", e));
    return { eventId };
  });
}

export async function discardIngestEventAction(input: unknown) {
  return runAction(ingestEventActionSchema, input, ({ eventId }, { actor }) => discardIngestEvent(actor, eventId));
}
