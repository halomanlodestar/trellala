import { prisma, type Tx } from "@trellala/db";
import type { z } from "zod";
import { conflictError, invalid, notFound } from "../errors";
import { slugKey, uniqueKey } from "../fields";
import type {
  createTeamMilestoneSchema,
  createTeamSchema,
  setProgressSchema,
  setTeamStatusSchema,
  updateTeamSchema,
} from "../schemas";
import type { Actor } from "../types";
import { logActivity } from "./activity";
import { evaluateArchive } from "./archive";

type UserActor = Actor & { type: "USER" };

/** One team per user per hackathon; returns names of users already on another team. */
async function assertMembersFree(tx: Tx, hackathonId: string, memberIds: string[], teamId?: string) {
  if (memberIds.length === 0) return;
  const users = await tx.user.count({ where: { id: { in: memberIds } } });
  if (users !== memberIds.length) throw invalid("Unknown member");
  const taken = await tx.teamMember.findMany({
    where: { hackathonId, userId: { in: memberIds }, ...(teamId ? { teamId: { not: teamId } } : {}) },
    include: { user: { select: { name: true } }, team: { select: { name: true } } },
  });
  if (taken.length) {
    throw conflictError(taken.map((t) => `${t.user.name} is on ${t.team.name}`).join(", "));
  }
}

async function syncMembers(tx: Tx, actor: UserActor, hackathonId: string, teamId: string, memberIds: string[]) {
  const current = await tx.teamMember.findMany({ where: { teamId }, select: { userId: true } });
  const currentIds = new Set(current.map((m) => m.userId));
  const next = new Set(memberIds);
  const added = memberIds.filter((id) => !currentIds.has(id));
  const removed = [...currentIds].filter((id) => !next.has(id));

  if (removed.length) await tx.teamMember.deleteMany({ where: { teamId, userId: { in: removed } } });
  if (added.length) await tx.teamMember.createMany({ data: added.map((userId) => ({ teamId, userId, hackathonId })) });
  for (const userId of added) {
    await logActivity(tx, actor, { action: "team.member_added", entityType: "Team", entityId: teamId, hackathonId, after: { userId } });
  }
  for (const userId of removed) {
    await logActivity(tx, actor, { action: "team.member_removed", entityType: "Team", entityId: teamId, hackathonId, before: { userId } });
  }
}

export async function createTeam(actor: UserActor, input: z.output<typeof createTeamSchema>) {
  return prisma.$transaction(async (tx) => {
    const h = await tx.hackathon.findUnique({ where: { id: input.hackathonId }, select: { id: true } });
    if (!h) throw notFound("Hackathon");
    await assertMembersFree(tx, input.hackathonId, input.memberIds);

    const { memberIds, ...fields } = input;
    const team = await tx.team.create({ data: { ...fields, createdById: actor.userId } });
    await logActivity(tx, actor, { action: "team.created", entityType: "Team", entityId: team.id, hackathonId: h.id, after: { name: team.name } });
    await syncMembers(tx, actor, h.id, team.id, memberIds);
    await evaluateArchive(tx, h.id);
    return { id: team.id };
  });
}

export async function updateTeam(actor: UserActor, input: z.output<typeof updateTeamSchema>) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: input.teamId } });
    if (!team) throw notFound("Team");
    await assertMembersFree(tx, team.hackathonId, input.memberIds, team.id);

    const { teamId, memberIds, ...fields } = input;
    const changed = Object.entries(fields).filter(([k, v]) => team[k as keyof typeof team] !== v);
    if (changed.length) {
      await tx.team.update({ where: { id: teamId }, data: fields });
      await logActivity(tx, actor, {
        action: "team.updated",
        entityType: "Team",
        entityId: teamId,
        hackathonId: team.hackathonId,
        before: Object.fromEntries(changed.map(([k]) => [k, team[k as keyof typeof team]])),
        after: Object.fromEntries(changed),
      });
    }
    await syncMembers(tx, actor, team.hackathonId, teamId, memberIds);
    return { id: teamId };
  });
}

export async function setTeamStatus(actor: UserActor, input: z.output<typeof setTeamStatusSchema>) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: input.teamId } });
    if (!team) throw notFound("Team");
    if (input.wonPrizeId) {
      const prize = await tx.prize.findFirst({ where: { id: input.wonPrizeId, hackathonId: team.hackathonId } });
      if (!prize) throw invalid("Prize is not part of this hackathon");
    }
    const wonPrizeId = input.status === "WON" ? input.wonPrizeId : null;
    await tx.team.update({ where: { id: team.id }, data: { status: input.status, wonPrizeId } });
    await logActivity(tx, actor, {
      action: "team.status_changed",
      entityType: "Team",
      entityId: team.id,
      hackathonId: team.hackathonId,
      before: { status: team.status },
      after: { status: input.status, wonPrizeId },
    });
    await evaluateArchive(tx, team.hackathonId);
  });
}

export async function setProgress(actor: UserActor, input: z.output<typeof setProgressSchema>) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: input.teamId } });
    if (!team) throw notFound("Team");
    const milestone = await tx.milestone.findFirst({
      where: { id: input.milestoneId, hackathonId: team.hackathonId, OR: [{ teamId: null }, { teamId: team.id }] },
    });
    if (!milestone) throw notFound("Milestone");

    const prev = await tx.teamMilestone.findUnique({ where: { teamId_milestoneId: { teamId: team.id, milestoneId: milestone.id } } });
    const data = {
      state: input.state,
      proofUrl: input.proofUrl,
      note: input.note,
      updatedById: actor.userId,
      completedAt: input.state === "DONE" ? (prev?.completedAt ?? new Date()) : null,
    };
    await tx.teamMilestone.upsert({
      where: { teamId_milestoneId: { teamId: team.id, milestoneId: milestone.id } },
      create: { teamId: team.id, milestoneId: milestone.id, ...data },
      update: data,
    });
    await logActivity(tx, actor, {
      action: input.state === "DONE" ? "milestone.completed" : input.state === "SKIPPED" ? "milestone.skipped" : "milestone.reopened",
      entityType: "TeamMilestone",
      entityId: milestone.id,
      hackathonId: team.hackathonId,
      before: { state: prev?.state ?? "TODO" },
      after: { state: input.state, teamId: team.id, title: milestone.title },
    });
    await evaluateArchive(tx, team.hackathonId);
  });
}

export async function createTeamMilestone(actor: UserActor, input: z.output<typeof createTeamMilestoneSchema>) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: input.teamId }, include: { milestones: { select: { key: true } } } });
    if (!team) throw notFound("Team");
    const key = uniqueKey(slugKey(input.title), new Set(team.milestones.map((m) => m.key)));
    const m = await tx.milestone.create({
      data: {
        hackathonId: team.hackathonId,
        teamId: team.id,
        key,
        kind: "CUSTOM",
        title: input.title,
        action: input.action,
        endsAt: input.endsAt,
        requiresAction: true,
        isHardDeadline: false,
        createdById: actor.userId,
      },
    });
    await logActivity(tx, actor, { action: "milestone.created", entityType: "Milestone", entityId: m.id, hackathonId: team.hackathonId, after: { title: m.title, teamId: team.id } });
    return { id: m.id };
  });
}

export async function deleteTeamMilestone(actor: UserActor, milestoneId: string) {
  return prisma.$transaction(async (tx) => {
    const m = await tx.milestone.findUnique({ where: { id: milestoneId } });
    if (!m || !m.teamId) throw notFound("Team milestone");
    await tx.milestone.delete({ where: { id: m.id } });
    await logActivity(tx, actor, { action: "milestone.deleted", entityType: "Milestone", entityId: m.id, hackathonId: m.hackathonId, before: { title: m.title, teamId: m.teamId } });
  });
}
