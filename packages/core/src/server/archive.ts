import { prisma, type Tx } from "@trellala/db";
import { decideArchive } from "../rules/archive";
import { logActivity, SYSTEM } from "./activity";

/**
 * Applies the archive rules to one hackathon (marks MISSED, archives, unarchives).
 * Called after relevant writes and by the periodic sweep. Changes are logged as SYSTEM.
 */
export async function evaluateArchive(tx: Tx, hackathonId: string, now = new Date()) {
  const h = await tx.hackathon.findUnique({
    where: { id: hackathonId },
    include: { milestones: { where: { teamId: null } }, teams: { include: { progress: true } } },
  });
  if (!h) return null;

  const d = decideArchive(
    {
      archivedAt: h.archivedAt,
      archiveReason: h.archiveReason,
      archivedById: h.archivedById,
      eventMilestones: h.milestones,
      teams: h.teams.map((t) => ({ id: t.id, status: t.status, createdAt: t.createdAt, progress: t.progress })),
    },
    now,
  );

  for (const { teamId, milestoneId } of d.markMissed) {
    await tx.teamMilestone.upsert({
      where: { teamId_milestoneId: { teamId, milestoneId } },
      create: { teamId, milestoneId, state: "MISSED" },
      update: { state: "MISSED" },
    });
    await logActivity(tx, SYSTEM, { action: "milestone.missed", entityType: "TeamMilestone", entityId: milestoneId, hackathonId, after: { teamId } });
  }
  for (const { teamId, milestoneId } of d.revertMissed) {
    await tx.teamMilestone.update({ where: { teamId_milestoneId: { teamId, milestoneId } }, data: { state: "TODO" } });
    await logActivity(tx, SYSTEM, { action: "milestone.unmissed", entityType: "TeamMilestone", entityId: milestoneId, hackathonId, after: { teamId } });
  }
  for (const teamId of d.teamsToMissed) {
    await tx.team.update({ where: { id: teamId }, data: { status: "MISSED" } });
    await logActivity(tx, SYSTEM, { action: "team.status_changed", entityType: "Team", entityId: teamId, hackathonId, after: { status: "MISSED" } });
  }
  for (const teamId of d.teamsToActive) {
    await tx.team.update({ where: { id: teamId }, data: { status: "ACTIVE" } });
    await logActivity(tx, SYSTEM, { action: "team.status_changed", entityType: "Team", entityId: teamId, hackathonId, before: { status: "MISSED" }, after: { status: "ACTIVE" } });
  }
  if (d.archive) {
    await tx.hackathon.update({
      where: { id: hackathonId },
      data: { archivedAt: now, archiveReason: d.archive, archivedById: null, archiveNote: null },
    });
    await logActivity(tx, SYSTEM, { action: "hackathon.archived", entityType: "Hackathon", entityId: hackathonId, hackathonId, after: { reason: d.archive } });
  }
  if (d.unarchive) {
    await tx.hackathon.update({
      where: { id: hackathonId },
      data: { archivedAt: null, archiveReason: null, archivedById: null, archiveNote: null },
    });
    await logActivity(tx, SYSTEM, { action: "hackathon.unarchived", entityType: "Hackathon", entityId: hackathonId, hackathonId, before: { reason: h.archiveReason } });
  }
  return d;
}

/** Evaluates every hackathon that is active or archived by the system. */
export async function runArchiveSweep(now = new Date()) {
  const targets = await prisma.hackathon.findMany({
    where: { OR: [{ archivedAt: null }, { archivedById: null, archiveReason: { in: ["CONCLUDED", "ALL_TEAMS_OUT", "NO_TEAM_REGISTERED"] } }] },
    select: { id: true },
  });
  let changed = 0;
  for (const { id } of targets) {
    const d = await prisma.$transaction((tx) => evaluateArchive(tx, id, now));
    if (d && (d.archive || d.unarchive || d.markMissed.length || d.revertMissed.length)) changed++;
  }
  return { evaluated: targets.length, changed };
}
