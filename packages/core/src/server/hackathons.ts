import { prisma, type Tx } from "@trellala/db";
import { changedPaths, flatten, normalizeUrl, slugKey, uniqueKey } from "../fields";
import { conflictError, invalid, notFound } from "../errors";
import type { Actor, FieldSources, HackathonFormData, HackathonStage, ManualArchiveReason } from "../types";
import { logActivity, sourceOf } from "./activity";
import { evaluateArchive } from "./archive";

const USER_ONLY_FIELDS = ["stage", "effortEstimate", "fitScore", "notes"] as const;

function fieldData(data: HackathonFormData) {
  return {
    name: data.name,
    description: data.description,
    type: data.type,
    mode: data.mode,
    location: data.location,
    stage: data.stage,
    sourceUrl: data.sourceUrl,
    normalizedUrl: normalizeUrl(data.sourceUrl),
    teamSizeMin: data.teamSizeMin,
    teamSizeMax: data.teamSizeMax,
    eligibility: data.eligibility,
    estimatedUsd: data.estimatedUsd,
    effortEstimate: data.effortEstimate,
    fitScore: data.fitScore,
    tags: data.tags,
    notes: data.notes,
  };
}

const milestoneData = (m: HackathonFormData["milestones"][number]) => ({
  kind: m.kind,
  title: m.title,
  action: m.action,
  startsAt: m.startsAt,
  endsAt: m.endsAt,
  sourceTimezone: m.sourceTimezone,
  requiresAction: m.requiresAction,
  isHardDeadline: m.isHardDeadline,
});

const prizeData = (p: HackathonFormData["prizes"][number]) => ({
  title: p.title,
  kind: p.kind,
  amount: p.amount,
  currency: p.currency,
  description: p.description,
  estimatedUsd: p.estimatedUsd,
});

export async function loadAggregate(tx: Tx, hackathonId: string) {
  return tx.hackathon.findUnique({
    where: { id: hackathonId },
    include: { milestones: { where: { teamId: null } }, prizes: true },
  });
}

export async function createHackathon(actor: Actor & { type: "USER" }, data: HackathonFormData) {
  return prisma.$transaction(async (tx) => {
    const mKeys = new Set<string>();
    const pKeys = new Set<string>();
    const h = await tx.hackathon.create({
      data: {
        ...fieldData(data),
        createdById: actor.userId,
        milestones: {
          create: data.milestones.map((m, i) => ({ ...milestoneData(m), key: uniqueKey(m.key || slugKey(m.title), mKeys), sortOrder: i, createdById: actor.userId })),
        },
        prizes: { create: data.prizes.map((p, i) => ({ ...prizeData(p), key: uniqueKey(p.key || slugKey(p.title), pKeys), sortOrder: i })) },
      },
      include: { milestones: true, prizes: true },
    });

    const source = sourceOf(actor);
    const fieldSources: FieldSources = Object.fromEntries(Object.keys(flatten(h)).map((p) => [p, source]));
    await tx.hackathon.update({ where: { id: h.id }, data: { fieldSources } });
    await logActivity(tx, actor, { action: "hackathon.created", entityType: "Hackathon", entityId: h.id, hackathonId: h.id, after: { name: h.name } });
    await evaluateArchive(tx, h.id);
    return { id: h.id };
  });
}

export async function updateHackathon(actor: Actor & { type: "USER" }, hackathonId: string, data: HackathonFormData) {
  return prisma.$transaction(async (tx) => {
    const current = await loadAggregate(tx, hackathonId);
    if (!current) throw notFound("Hackathon");
    const before = flatten(current);

    // Milestones: update by id, create new, delete removed.
    const existingM = new Map(current.milestones.map((m) => [m.id, m]));
    const mKeys = new Set(current.milestones.map((m) => m.key));
    const keepM = new Set<string>();
    for (const [i, m] of data.milestones.entries()) {
      if (m.id) {
        if (!existingM.has(m.id)) throw invalid("Unknown milestone");
        keepM.add(m.id);
        await tx.milestone.update({ where: { id: m.id }, data: { ...milestoneData(m), sortOrder: i } });
      } else {
        await tx.milestone.create({
          data: { ...milestoneData(m), hackathonId, key: uniqueKey(m.key || slugKey(m.title), mKeys), sortOrder: i, createdById: actor.userId },
        });
      }
    }
    const removedM = current.milestones.filter((m) => !keepM.has(m.id)).map((m) => m.id);
    if (removedM.length) await tx.milestone.deleteMany({ where: { id: { in: removedM } } });

    // Prizes: same approach.
    const existingP = new Map(current.prizes.map((p) => [p.id, p]));
    const pKeys = new Set(current.prizes.map((p) => p.key));
    const keepP = new Set<string>();
    for (const [i, p] of data.prizes.entries()) {
      if (p.id) {
        if (!existingP.has(p.id)) throw invalid("Unknown prize");
        keepP.add(p.id);
        await tx.prize.update({ where: { id: p.id }, data: { ...prizeData(p), sortOrder: i } });
      } else {
        await tx.prize.create({ data: { ...prizeData(p), hackathonId, key: uniqueKey(p.key || slugKey(p.title), pKeys), sortOrder: i } });
      }
    }
    const removedP = current.prizes.filter((p) => !keepP.has(p.id)).map((p) => p.id);
    if (removedP.length) await tx.prize.deleteMany({ where: { id: { in: removedP } } });

    await tx.hackathon.update({ where: { id: hackathonId }, data: fieldData(data) });

    const updated = await loadAggregate(tx, hackathonId);
    if (!updated) throw notFound("Hackathon");
    const after = flatten(updated);
    const changed = changedPaths(before, after);

    // Edited fields are now owned by this user.
    const fieldSources = { ...((current.fieldSources ?? {}) as FieldSources) };
    const source = sourceOf(actor);
    for (const path of changed) {
      if (path in after) fieldSources[path] = source;
      else delete fieldSources[path];
    }
    await tx.hackathon.update({ where: { id: hackathonId }, data: { fieldSources } });

    const userOnlyChanged = USER_ONLY_FIELDS.filter((f) => JSON.stringify(current[f]) !== JSON.stringify(updated[f]));
    if (changed.length || userOnlyChanged.length) {
      const pick = (flat: Record<string, unknown>, row: Record<string, unknown>) => ({
        ...Object.fromEntries(changed.map((p) => [p, flat[p] ?? null])),
        ...Object.fromEntries(userOnlyChanged.map((f) => [f, row[f] ?? null])),
      });
      await logActivity(tx, actor, {
        action: "hackathon.updated",
        entityType: "Hackathon",
        entityId: hackathonId,
        hackathonId,
        before: pick(before, current),
        after: pick(after, updated),
      });
    }
    await evaluateArchive(tx, hackathonId);
    return { id: hackathonId };
  });
}

export async function setStage(actor: Actor, hackathonId: string, stage: HackathonStage) {
  return prisma.$transaction(async (tx) => {
    const h = await tx.hackathon.findUnique({ where: { id: hackathonId }, select: { stage: true } });
    if (!h) throw notFound("Hackathon");
    if (h.stage === stage) return;
    await tx.hackathon.update({ where: { id: hackathonId }, data: { stage } });
    await logActivity(tx, actor, { action: "hackathon.stage_changed", entityType: "Hackathon", entityId: hackathonId, hackathonId, before: { stage: h.stage }, after: { stage } });
  });
}

export async function archiveHackathon(actor: Actor & { type: "USER" }, hackathonId: string, reason: ManualArchiveReason, note: string | null) {
  return prisma.$transaction(async (tx) => {
    const h = await tx.hackathon.findUnique({ where: { id: hackathonId }, select: { archivedAt: true } });
    if (!h) throw notFound("Hackathon");
    if (h.archivedAt) throw conflictError("Already archived");
    await tx.hackathon.update({
      where: { id: hackathonId },
      data: { archivedAt: new Date(), archiveReason: reason, archiveNote: note, archivedById: actor.userId },
    });
    await logActivity(tx, actor, { action: "hackathon.archived", entityType: "Hackathon", entityId: hackathonId, hackathonId, after: { reason }, note });
  });
}

export async function unarchiveHackathon(actor: Actor, hackathonId: string) {
  return prisma.$transaction(async (tx) => {
    const h = await tx.hackathon.findUnique({ where: { id: hackathonId }, select: { archivedAt: true, archiveReason: true } });
    if (!h) throw notFound("Hackathon");
    if (!h.archivedAt) throw conflictError("Not archived");
    await tx.hackathon.update({
      where: { id: hackathonId },
      data: { archivedAt: null, archiveReason: null, archiveNote: null, archivedById: null },
    });
    await logActivity(tx, actor, { action: "hackathon.unarchived", entityType: "Hackathon", entityId: hackathonId, hackathonId, before: { reason: h.archiveReason } });
    const d = await evaluateArchive(tx, hackathonId);
    // Rolls back the whole transaction: the rule that archived it still applies.
    if (d?.archive) throw conflictError(`Still applies: ${d.archive.toLowerCase().replaceAll("_", " ")}. Change a deadline or team first.`);
  });
}

