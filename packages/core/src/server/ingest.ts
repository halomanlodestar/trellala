import { prisma, type Prisma, type Tx } from "@trellala/db";
import type { z } from "zod";
import { conflictError, invalid, notFound } from "../errors";
import { flatten, normalizeUrl, normalizeValue, parsePath, slugKey, uniqueKey, valuesEqual } from "../fields";
import { decideFields } from "../rules/ingest-decide";
import {
  ingestHackathonObject,
  ingestHackathonSchema,
  ingestMilestoneSchema,
  ingestPrizeSchema,
  type resolveConflictSchema,
} from "../schemas";
import type {
  Actor,
  ConflictDetail,
  ConflictSummary,
  FieldSources,
  IngestEventView,
  IngestHackathon,
  IngestItemResult,
  JsonValue,
  ReviewCounts,
} from "../types";
import { logActivity, sourceOf, SYSTEM, toJson } from "./activity";
import { evaluateArchive } from "./archive";

type IngestMilestone = NonNullable<IngestHackathon["milestones"]>[number];
type IngestPrize = NonNullable<IngestHackathon["prizes"]>[number];

/** Stable key for an ingested milestone when the source doesn't send one. */
function milestoneKey(m: IngestMilestone): string {
  if (m.key) return m.key;
  return m.kind === "CUSTOM" || m.kind === "ROUND" ? slugKey(m.title) : m.kind.toLowerCase();
}

const prizeKey = (p: IngestPrize) => p.key ?? slugKey(p.title);

function keyed(payload: IngestHackathon) {
  const mTaken = new Set<string>();
  const pTaken = new Set<string>();
  return {
    milestones: (payload.milestones ?? []).map((m) => ({ ...m, key: uniqueKey(milestoneKey(m), mTaken) })),
    prizes: (payload.prizes ?? []).map((p) => ({
      ...p,
      key: uniqueKey(prizeKey(p), pTaken),
      ...(p.currency ? { currency: p.currency.toUpperCase() } : {}),
    })),
  };
}

// ─── Enqueue side (API) ─────────────────────────────────────────────────────

/** Stores each item as an IngestEvent: valid → QUEUED, invalid → FAILED. Caller enqueues the queued ids. */
export async function createIngestEvents(apiKey: { id: string; source: string }, items: unknown[]): Promise<IngestItemResult[]> {
  const results: IngestItemResult[] = [];
  for (const [index, raw] of items.entries()) {
    const parsed = ingestHackathonSchema.safeParse(raw);
    const meta =
      raw && typeof raw === "object"
        ? {
            externalId: typeof (raw as Record<string, unknown>).externalId === "string" ? String((raw as Record<string, unknown>).externalId).slice(0, 200) : null,
            sourceUrl: typeof (raw as Record<string, unknown>).sourceUrl === "string" ? String((raw as Record<string, unknown>).sourceUrl).slice(0, 2048) : null,
          }
        : { externalId: null, sourceUrl: null };

    const event = await prisma.ingestEvent.create({
      data: {
        apiKeyId: apiKey.id,
        source: apiKey.source,
        ...meta,
        payload: toJson(raw ?? null) as Prisma.InputJsonValue,
        status: parsed.success ? "QUEUED" : "FAILED",
        error: parsed.success ? null : parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("\n"),
        processedAt: parsed.success ? null : new Date(),
      },
    });
    results.push(
      parsed.success
        ? { index, status: "queued", eventId: event.id }
        : { index, status: "invalid", eventId: event.id, issues: parsed.error.issues },
    );
  }
  return results;
}

// ─── Worker side ────────────────────────────────────────────────────────────

const RETRYABLE = new Set(["QUEUED", "PROCESSING"]);

/** Processes one event. Throws only on unexpected errors (so the queue retries). */
export async function processIngestEvent(eventId: string, now = new Date()) {
  const ev = await prisma.ingestEvent.findUnique({ where: { id: eventId } });
  if (!ev || !RETRYABLE.has(ev.status)) return { skipped: true as const };

  await prisma.ingestEvent.update({ where: { id: ev.id }, data: { status: "PROCESSING", attempts: { increment: 1 } } });

  const parsed = ingestHackathonSchema.safeParse(ev.payload);
  if (!parsed.success) {
    await markIngestFailed(ev.id, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
    return { skipped: false as const, status: "FAILED" as const };
  }

  const actor: Actor = ev.apiKeyId ? { type: "API_KEY", apiKeyId: ev.apiKeyId, source: ev.source } : SYSTEM;
  const source = `ingest:${ev.source}`;
  const payload = parsed.data;

  const status = await prisma.$transaction(async (tx) => {
    const match = await findMatch(tx, ev.source, payload);
    const outcome = match
      ? await applyToExisting(tx, actor, source, ev.id, match.id, payload)
      : await createFromIngest(tx, actor, source, payload);

    await tx.ingestEvent.update({
      where: { id: ev.id },
      data: { status: outcome.status, hackathonId: outcome.hackathonId, result: toJson(outcome.result) as Prisma.InputJsonValue, error: null, processedAt: new Date() },
    });
    await evaluateArchive(tx, outcome.hackathonId, now);
    return outcome.status;
  });
  return { skipped: false as const, status };
}

export async function markIngestFailed(eventId: string, error: string) {
  await prisma.ingestEvent.updateMany({
    where: { id: eventId, status: { in: ["QUEUED", "PROCESSING"] } },
    data: { status: "FAILED", error: error.slice(0, 10000), processedAt: new Date() },
  });
}

/** Events stuck in QUEUED (e.g. Redis was down when they were created). */
export async function listStaleQueuedEvents(olderThanMs: number) {
  const rows = await prisma.ingestEvent.findMany({
    where: { status: "QUEUED", createdAt: { lt: new Date(Date.now() - olderThanMs) } },
    select: { id: true },
    take: 500,
  });
  return rows.map((r) => r.id);
}

async function findMatch(tx: Tx, source: string, p: IngestHackathon) {
  if (p.externalId) {
    const byId = await tx.hackathon.findUnique({ where: { source_externalId: { source, externalId: p.externalId } }, select: { id: true } });
    if (byId) return byId;
  }
  const url = normalizeUrl(p.sourceUrl);
  if (url) return tx.hackathon.findFirst({ where: { normalizedUrl: url }, select: { id: true }, orderBy: { createdAt: "asc" } });
  return null;
}

async function createFromIngest(tx: Tx, actor: Actor, source: string, p: IngestHackathon) {
  const { milestones, prizes } = keyed(p);
  const h = await tx.hackathon.create({
    data: {
      name: p.name,
      description: p.description ?? null,
      type: p.type ?? "OTHER",
      mode: p.mode ?? "ONLINE",
      location: p.location ?? null,
      source: source.replace(/^ingest:/, ""),
      externalId: p.externalId ?? null,
      sourceUrl: p.sourceUrl ?? null,
      normalizedUrl: normalizeUrl(p.sourceUrl),
      teamSizeMin: p.teamSizeMin ?? null,
      teamSizeMax: p.teamSizeMax ?? null,
      eligibility: p.eligibility ?? null,
      estimatedUsd: p.estimatedUsd ?? null,
      tags: p.tags ?? [],
      milestones: { create: milestones.map((m, i) => milestoneCreate(m, i)) },
      prizes: { create: prizes.map((pr, i) => prizeCreate(pr, i)) },
    },
    include: { milestones: true, prizes: true },
  });
  const fieldSources: FieldSources = Object.fromEntries(Object.keys(flatten(h)).map((path) => [path, source]));
  await tx.hackathon.update({ where: { id: h.id }, data: { fieldSources } });
  await logActivity(tx, actor, { action: "hackathon.created", entityType: "Hackathon", entityId: h.id, hackathonId: h.id, after: { name: h.name, source } });
  return { hackathonId: h.id, status: "APPLIED" as const, result: { created: true, applied: [], added: [], conflicted: [] } };
}

const milestoneCreate = (m: IngestMilestone & { key: string }, sortOrder: number) => ({
  key: m.key,
  kind: m.kind,
  title: m.title,
  action: m.action ?? null,
  startsAt: m.startsAt ?? null,
  endsAt: m.endsAt,
  sourceTimezone: m.sourceTimezone ?? null,
  requiresAction: m.requiresAction ?? true,
  isHardDeadline: m.isHardDeadline ?? true,
  sortOrder,
});

const prizeCreate = (p: IngestPrize & { key: string }, sortOrder: number) => ({
  key: p.key,
  title: p.title,
  kind: p.kind,
  amount: p.amount ?? null,
  currency: p.currency ? p.currency.toUpperCase() : null,
  description: p.description ?? null,
  estimatedUsd: p.estimatedUsd ?? null,
  sortOrder,
});

/** "path|source|value" for candidate values a person already rejected, so re-sends don't reopen conflicts. */
async function rejectedCandidates(tx: Tx, hackathonId: string) {
  const resolved = await tx.conflict.findMany({
    where: { hackathonId, status: "RESOLVED" },
    include: { candidates: true },
  });
  const set = new Set<string>();
  for (const c of resolved) {
    for (const cand of c.candidates) {
      if (!valuesEqual(cand.value as JsonValue, c.resolvedValue as JsonValue)) {
        set.add(`${c.fieldPath}|${cand.source}|${JSON.stringify(cand.value)}`);
      }
    }
  }
  return set;
}

async function applyToExisting(tx: Tx, actor: Actor, source: string, eventId: string, hackathonId: string, p: IngestHackathon) {
  const current = await tx.hackathon.findUnique({
    where: { id: hackathonId },
    include: { milestones: { where: { teamId: null } }, prizes: true },
  });
  if (!current) throw notFound("Hackathon");

  const { milestones, prizes } = keyed(p);
  const incomingAgg = { ...p, milestones, prizes };
  const incoming = flatten(incomingAgg);
  const currentFlat = flatten(current);
  // URL variants (www, trailing slash, case) aren't a change.
  if (typeof incoming.sourceUrl === "string" && normalizeUrl(incoming.sourceUrl) === normalizeUrl(current.sourceUrl)) {
    delete incoming.sourceUrl;
  }
  const fieldSources = { ...((current.fieldSources ?? {}) as FieldSources) };
  const openConflicts = await tx.conflict.findMany({ where: { hackathonId, status: "OPEN" }, select: { id: true, fieldPath: true } });
  const openByPath = new Map(openConflicts.map((c) => [c.fieldPath, c.id]));
  const rejected = await rejectedCandidates(tx, hackathonId);

  const decisions = decideFields({
    current: currentFlat,
    incoming,
    fieldSources,
    source,
    openConflictPaths: new Set(openByPath.keys()),
    milestoneKeys: new Set(current.milestones.map((m) => m.key)),
    prizeKeys: new Set(current.prizes.map((pr) => pr.key)),
  }).map((d) =>
    d.outcome === "conflict" && rejected.has(`${d.path}|${source}|${JSON.stringify(d.value)}`) ? { path: d.path, outcome: "unchanged" as const } : d,
  );

  const applied: string[] = [];
  const added: string[] = [];
  const conflicted: string[] = [];
  const hackathonUpdate: Record<string, unknown> = {};
  const milestoneUpdates = new Map<string, Record<string, unknown>>();
  const prizeUpdates = new Map<string, Record<string, unknown>>();
  const addedMilestoneKeys = new Set<string>();
  const addedPrizeKeys = new Set<string>();

  for (const d of decisions) {
    const parsed = parsePath(d.path);
    if (!parsed) continue;
    if (d.outcome === "applied") {
      const value = valueFromIncoming(incomingAgg, d.path);
      if (parsed.entity === "hackathon") hackathonUpdate[parsed.field] = value;
      else if (parsed.entity === "milestone") milestoneUpdates.set(parsed.key, { ...milestoneUpdates.get(parsed.key), [parsed.field]: value });
      else prizeUpdates.set(parsed.key, { ...prizeUpdates.get(parsed.key), [parsed.field]: value });
      fieldSources[d.path] = source;
      applied.push(d.path);
    } else if (d.outcome === "added") {
      if (parsed.entity === "milestone") addedMilestoneKeys.add(parsed.key);
      if (parsed.entity === "prize") addedPrizeKeys.add(parsed.key);
      fieldSources[d.path] = source;
      added.push(d.path);
    } else if (d.outcome === "conflict") {
      conflicted.push(d.path);
      const existingId = openByPath.get(d.path);
      if (existingId) {
        await tx.conflictCandidate.upsert({
          where: { conflictId_source: { conflictId: existingId, source } },
          create: { conflictId: existingId, source, value: toJson(d.value) as Prisma.InputJsonValue, ingestEventId: eventId },
          update: { value: toJson(d.value) as Prisma.InputJsonValue, ingestEventId: eventId, receivedAt: new Date() },
        });
        await tx.conflict.update({ where: { id: existingId }, data: { updatedAt: new Date() } });
        await logActivity(tx, actor, { action: "conflict.candidate_added", entityType: "Conflict", entityId: existingId, hackathonId, after: { fieldPath: d.path, value: d.value } });
      } else {
        const c = await tx.conflict.create({
          data: {
            hackathonId,
            fieldPath: d.path,
            currentValue: toJson(d.currentValue ?? null),
            currentSource: d.currentSource ?? null,
            candidates: { create: { source, value: toJson(d.value) as Prisma.InputJsonValue, ingestEventId: eventId } },
          },
        });
        openByPath.set(d.path, c.id);
        await logActivity(tx, actor, {
          action: "conflict.opened",
          entityType: "Conflict",
          entityId: c.id,
          hackathonId,
          before: { value: d.currentValue ?? null, source: d.currentSource ?? null },
          after: { value: d.value, source },
        });
      }
    }
  }

  if (Object.keys(hackathonUpdate).length) {
    if ("sourceUrl" in hackathonUpdate) hackathonUpdate.normalizedUrl = normalizeUrl(hackathonUpdate.sourceUrl as string | null);
    await tx.hackathon.update({ where: { id: hackathonId }, data: hackathonUpdate });
  }
  const mIdByKey = new Map(current.milestones.map((m) => [m.key, m.id]));
  for (const [key, data] of milestoneUpdates) {
    const id = mIdByKey.get(key);
    if (id) await tx.milestone.update({ where: { id }, data });
  }
  const pIdByKey = new Map(current.prizes.map((pr) => [pr.key, pr.id]));
  for (const [key, data] of prizeUpdates) {
    const id = pIdByKey.get(key);
    if (id) await tx.prize.update({ where: { id }, data });
  }
  const mOffset = current.milestones.length;
  for (const [i, m] of milestones.filter((m) => addedMilestoneKeys.has(m.key)).entries()) {
    await tx.milestone.create({ data: { ...milestoneCreate(m, mOffset + i), hackathonId } });
  }
  const pOffset = current.prizes.length;
  for (const [i, pr] of prizes.filter((pr) => addedPrizeKeys.has(pr.key)).entries()) {
    await tx.prize.create({ data: { ...prizeCreate(pr, pOffset + i), hackathonId } });
  }
  await tx.hackathon.update({ where: { id: hackathonId }, data: { fieldSources } });

  const changed = [...applied, ...added];
  if (changed.length) {
    await logActivity(tx, actor, {
      action: "ingest.applied",
      entityType: "Hackathon",
      entityId: hackathonId,
      hackathonId,
      before: Object.fromEntries(changed.map((path) => [path, currentFlat[path] ?? null])),
      after: Object.fromEntries(changed.map((path) => [path, incoming[path] ?? null])),
    });
  }

  const status = conflicted.length ? ("PARTIAL" as const) : changed.length ? ("APPLIED" as const) : ("NO_CHANGE" as const);
  return { hackathonId, status, result: { created: false, applied, added, conflicted } };
}

/** The Prisma-ready value for a path, read from the parsed payload (keeps Dates as Dates). */
function valueFromIncoming(agg: { milestones: { key: string }[]; prizes: { key: string }[] } & Record<string, unknown>, path: string): unknown {
  const parsed = parsePath(path);
  if (!parsed) return undefined;
  if (parsed.entity === "hackathon") return agg[parsed.field];
  const list = parsed.entity === "milestone" ? agg.milestones : agg.prizes;
  const item = list.find((x) => x.key === parsed.key) as Record<string, unknown> | undefined;
  const value = item?.[parsed.field];
  return parsed.field === "currency" && typeof value === "string" ? value.toUpperCase() : value;
}

// ─── Conflicts ──────────────────────────────────────────────────────────────

/** Validates a value for one field path, returning what Prisma expects. */
function parseFieldValue(path: string, value: unknown): unknown {
  const parsed = parsePath(path);
  if (!parsed) throw invalid("Unknown field");
  const shape =
    parsed.entity === "hackathon"
      ? ingestHackathonObject.shape[parsed.field as keyof typeof ingestHackathonObject.shape]
      : parsed.entity === "milestone"
        ? ingestMilestoneSchema.shape[parsed.field as keyof typeof ingestMilestoneSchema.shape]
        : ingestPrizeSchema.shape[parsed.field as keyof typeof ingestPrizeSchema.shape];
  if (!shape) throw invalid("Unknown field");
  const result = (shape as z.ZodType).safeParse(value === undefined ? null : value);
  if (!result.success) throw invalid(result.error.issues[0]?.message ?? "Invalid value");
  return result.data;
}

async function writeFieldValue(tx: Tx, hackathonId: string, path: string, value: unknown): Promise<boolean> {
  const parsed = parsePath(path);
  if (!parsed) return false;
  if (parsed.entity === "hackathon") {
    const data: Record<string, unknown> = { [parsed.field]: value };
    if (parsed.field === "sourceUrl") data.normalizedUrl = normalizeUrl(value as string | null);
    if (parsed.field === "tags" && value === null) data.tags = [];
    await tx.hackathon.update({ where: { id: hackathonId }, data });
    return true;
  }
  const where = { hackathonId, key: parsed.key };
  const field = parsed.field === "currency" && typeof value === "string" ? value.toUpperCase() : value;
  if (parsed.entity === "milestone") {
    const r = await tx.milestone.updateMany({ where: { ...where, teamId: null }, data: { [parsed.field]: field } });
    return r.count > 0;
  }
  const r = await tx.prize.updateMany({ where, data: { [parsed.field]: field } });
  return r.count > 0;
}

export async function resolveConflict(actor: Actor & { type: "USER" }, input: z.output<typeof resolveConflictSchema>) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.conflict.findUnique({ where: { id: input.conflictId }, include: { candidates: true } });
    if (!c) throw notFound("Conflict");
    if (c.status !== "OPEN") throw conflictError("Already resolved");

    const agg = await tx.hackathon.findUnique({
      where: { id: c.hackathonId },
      include: { milestones: { where: { teamId: null } }, prizes: true },
    });
    if (!agg) throw notFound("Hackathon");
    const liveValue = flatten(agg)[c.fieldPath] ?? null;

    let chosen: JsonValue | null;
    if (input.choice === "current") chosen = liveValue;
    else if (input.choice === "candidate") {
      const cand = c.candidates.find((x) => x.id === input.candidateId);
      if (!cand) throw notFound("Candidate");
      chosen = cand.value as JsonValue;
    } else chosen = normalizeValue(parseFieldValue(c.fieldPath, input.value)) ?? null;

    const stillExists = parsePath(c.fieldPath)?.entity === "hackathon" || c.fieldPath in flatten(agg);
    if (input.choice !== "current" && stillExists) {
      await writeFieldValue(tx, c.hackathonId, c.fieldPath, parseFieldValue(c.fieldPath, chosen));
    }

    const fieldSources = { ...((agg.fieldSources ?? {}) as FieldSources) };
    if (stillExists) fieldSources[c.fieldPath] = sourceOf(actor);
    await tx.hackathon.update({ where: { id: c.hackathonId }, data: { fieldSources } });

    await tx.conflict.update({
      where: { id: c.id },
      data: { status: "RESOLVED", resolvedValue: toJson(chosen), resolvedById: actor.userId, resolvedAt: new Date(), note: input.note ?? null },
    });
    await logActivity(tx, actor, {
      action: "conflict.resolved",
      entityType: "Conflict",
      entityId: c.id,
      hackathonId: c.hackathonId,
      before: { fieldPath: c.fieldPath, value: liveValue },
      after: { fieldPath: c.fieldPath, value: chosen },
      note: input.note ?? null,
    });
    await evaluateArchive(tx, c.hackathonId);
    return { hackathonId: c.hackathonId };
  });
}

export async function listOpenConflicts(): Promise<ConflictSummary[]> {
  const rows = await prisma.conflict.findMany({
    where: { status: "OPEN" },
    include: { hackathon: { select: { name: true } }, _count: { select: { candidates: true } } },
    orderBy: [{ hackathonId: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((c) => ({
    id: c.id,
    hackathonId: c.hackathonId,
    hackathonName: c.hackathon.name,
    fieldPath: c.fieldPath,
    status: c.status,
    currentValue: c.currentValue,
    currentSource: c.currentSource,
    candidateCount: c._count.candidates,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function getConflict(id: string): Promise<ConflictDetail | null> {
  const c = await prisma.conflict.findUnique({
    where: { id },
    include: {
      hackathon: { select: { name: true } },
      resolvedBy: { select: { name: true } },
      candidates: { orderBy: { receivedAt: "asc" } },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    hackathonId: c.hackathonId,
    hackathonName: c.hackathon.name,
    fieldPath: c.fieldPath,
    status: c.status,
    currentValue: c.currentValue,
    currentSource: c.currentSource,
    candidateCount: c.candidates.length,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    candidates: c.candidates.map((x) => ({ id: x.id, source: x.source, value: x.value, receivedAt: x.receivedAt, ingestEventId: x.ingestEventId })),
    resolvedValue: c.resolvedValue,
    resolvedByName: c.resolvedBy?.name ?? null,
    resolvedAt: c.resolvedAt,
    note: c.note,
  };
}

// ─── Ingest events (review) ─────────────────────────────────────────────────

const eventInclude = { hackathon: { select: { name: true } }, apiKey: { select: { name: true } } } as const;

function toEventView(e: Prisma.IngestEventGetPayload<{ include: typeof eventInclude }>): IngestEventView {
  return {
    id: e.id,
    source: e.source,
    externalId: e.externalId,
    sourceUrl: e.sourceUrl,
    status: e.status,
    hackathonId: e.hackathonId,
    hackathonName: e.hackathon?.name ?? null,
    apiKeyName: e.apiKey?.name ?? null,
    payload: e.payload,
    result: e.result,
    error: e.error,
    attempts: e.attempts,
    createdAt: e.createdAt,
    processedAt: e.processedAt,
  };
}

export async function listFailedIngests(): Promise<IngestEventView[]> {
  const rows = await prisma.ingestEvent.findMany({ where: { status: "FAILED" }, include: eventInclude, orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map(toEventView);
}

export async function listIngestEventsForHackathon(hackathonId: string): Promise<IngestEventView[]> {
  const rows = await prisma.ingestEvent.findMany({ where: { hackathonId }, include: eventInclude, orderBy: { createdAt: "desc" }, take: 100 });
  return rows.map(toEventView);
}

export async function getIngestEvent(id: string): Promise<IngestEventView | null> {
  const e = await prisma.ingestEvent.findUnique({ where: { id }, include: eventInclude });
  return e ? toEventView(e) : null;
}

/** Resets a FAILED event to QUEUED; the caller enqueues it again. */
export async function retryIngestEvent(actor: Actor, id: string) {
  return prisma.$transaction(async (tx) => {
    const e = await tx.ingestEvent.findUnique({ where: { id } });
    if (!e) throw notFound("Ingest event");
    if (e.status !== "FAILED") throw conflictError("Only failed events can be retried");
    await tx.ingestEvent.update({ where: { id }, data: { status: "QUEUED", error: null, processedAt: null } });
    await logActivity(tx, actor, { action: "ingest.retried", entityType: "IngestEvent", entityId: id, hackathonId: e.hackathonId });
    return { eventId: id };
  });
}

export async function discardIngestEvent(actor: Actor, id: string) {
  return prisma.$transaction(async (tx) => {
    const e = await tx.ingestEvent.findUnique({ where: { id } });
    if (!e) throw notFound("Ingest event");
    if (e.status !== "FAILED") throw conflictError("Only failed events can be discarded");
    await tx.ingestEvent.delete({ where: { id } });
    await logActivity(tx, actor, { action: "ingest.discarded", entityType: "IngestEvent", entityId: id, hackathonId: e.hackathonId, before: { source: e.source, error: e.error } });
  });
}

export async function getIngestEventForApi(apiKeyId: string, id: string) {
  const e = await prisma.ingestEvent.findFirst({ where: { id, apiKeyId } });
  if (!e) return null;
  return { id: e.id, status: e.status, hackathonId: e.hackathonId, result: e.result, error: e.error, createdAt: e.createdAt, processedAt: e.processedAt };
}

export async function lookupHackathon(source: string, q: { externalId?: string; sourceUrl?: string }) {
  const h = q.externalId
    ? await prisma.hackathon.findUnique({ where: { source_externalId: { source, externalId: q.externalId } } })
    : await prisma.hackathon.findFirst({ where: { normalizedUrl: normalizeUrl(q.sourceUrl) ?? "" } });
  if (!h) return null;
  return { id: h.id, name: h.name, source: h.source, externalId: h.externalId, sourceUrl: h.sourceUrl, archivedAt: h.archivedAt, updatedAt: h.updatedAt };
}

export async function getReviewCounts(): Promise<ReviewCounts> {
  const [conflicts, failed] = await Promise.all([
    prisma.conflict.count({ where: { status: "OPEN" } }),
    prisma.ingestEvent.count({ where: { status: "FAILED" } }),
  ]);
  return { conflicts, failed };
}
