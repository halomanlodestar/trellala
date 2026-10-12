import { Prisma, type Tx } from "@trellala/db";
import type { Actor } from "../types";

export type ActivityEntry = {
  action: string;
  entityType: "Hackathon" | "Team" | "Milestone" | "TeamMilestone" | "Prize" | "Conflict" | "IngestEvent" | "ApiKey" | "User";
  entityId: string;
  hackathonId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string | null;
};

export const toJson = (v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  v === undefined || v === null ? Prisma.JsonNull : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

/** Writes one ActivityLog row. Always call inside the mutation's transaction. */
export async function logActivity(tx: Tx, actor: Actor, entry: ActivityEntry) {
  await tx.activityLog.create({
    data: {
      actorType: actor.type,
      actorUserId: actor.type === "USER" ? actor.userId : null,
      actorApiKeyId: actor.type === "API_KEY" ? actor.apiKeyId : null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      hackathonId: entry.hackathonId ?? null,
      before: entry.before === undefined ? Prisma.DbNull : toJson(entry.before),
      after: entry.after === undefined ? Prisma.DbNull : toJson(entry.after),
      note: entry.note ?? null,
    },
  });
}

/** Provenance label for fieldSources. */
export function sourceOf(actor: Actor): string {
  if (actor.type === "USER") return `user:${actor.userId}`;
  if (actor.type === "API_KEY") return `ingest:${actor.source}`;
  return "system";
}

export const SYSTEM: Actor = { type: "SYSTEM" };
