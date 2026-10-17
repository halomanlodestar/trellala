import type { HackathonDetail, HackathonSummary, PersonView, TeamView } from "../types";
import { hackathonNextAction, priorityScore, teamNextAction } from "../rules/ranking";
import {
  type HackathonWithRelations,
  num,
  parseImportantLinks,
  prizeSummary,
  toMilestone,
  toPerson,
  toPrize,
  toProgress,
} from "./mappers";

export function toTeamViews(h: HackathonWithRelations, now: Date): TeamView[] {
  const eventMilestones = h.milestones.map(toMilestone);
  return h.teams.map((t) => {
    const base = {
      id: t.id,
      status: t.status,
      progress: t.progress.map(toProgress),
      milestones: t.milestones.map(toMilestone),
    };
    return {
      ...base,
      hackathonId: t.hackathonId,
      name: t.name,
      ideaTitle: t.ideaTitle,
      ideaDescription: t.ideaDescription,
      repoUrl: t.repoUrl,
      demoUrl: t.demoUrl,
      submissionUrl: t.submissionUrl,
      wonPrizeId: t.wonPrizeId,
      createdAt: t.createdAt,
      members: t.members.map((m) => toPerson(m.user)),
      nextAction: teamNextAction(base, eventMilestones, now),
    };
  });
}

function timelineSpan(ms: { startsAt: Date | null; endsAt: Date }[]) {
  if (ms.length === 0) return null;
  const starts = ms.map((m) => (m.startsAt ?? m.endsAt).getTime());
  const ends = ms.map((m) => m.endsAt.getTime());
  return { start: new Date(Math.min(...starts)), end: new Date(Math.max(...ends)) };
}

export function toSummary(h: HackathonWithRelations, now: Date): HackathonSummary {
  const eventMilestones = h.milestones.map(toMilestone);
  const teams = toTeamViews(h, now);
  const nextAction = hackathonNextAction(teams, eventMilestones, now);
  const estimatedUsd = num(h.estimatedUsd);
  const members = new Map<string, PersonView>();
  for (const t of teams) for (const m of t.members) members.set(m.id, m);

  return {
    id: h.id,
    name: h.name,
    type: h.type,
    mode: h.mode,
    location: h.location,
    stage: h.stage,
    tags: h.tags,
    sourceUrl: h.sourceUrl,
    teamSizeMin: h.teamSizeMin,
    teamSizeMax: h.teamSizeMax,
    estimatedUsd,
    prizeSummary: prizeSummary(h.prizes.map(toPrize)),
    createdAt: h.createdAt,
    archivedAt: h.archivedAt,
    archiveReason: h.archiveReason,
    teamCount: teams.length,
    members: [...members.values()],
    nextAction,
    priority: priorityScore({ nextAction, estimatedUsd, fitScore: h.fitScore, effortEstimate: h.effortEstimate, now }),
    hasMissedTeam: teams.some((t) => t.status === "MISSED"),
    span: timelineSpan(eventMilestones),
    milestoneCount: eventMilestones.length,
  };
}

export function toDetail(
  h: HackathonWithRelations & { archivedBy: { name: string } | null },
  openConflictCount: number,
  now: Date,
): HackathonDetail {
  return {
    ...toSummary(h, now),
    description: h.description,
    eligibility: h.eligibility,
    effortEstimate: h.effortEstimate,
    fitScore: h.fitScore,
    notes: h.notes,
    importantLinks: parseImportantLinks(h.importantLinks),
    source: h.source,
    externalId: h.externalId,
    fieldSources: (h.fieldSources ?? {}) as Record<string, string>,
    archiveNote: h.archiveNote,
    archivedByName: h.archivedBy?.name ?? null,
    milestones: h.milestones.map(toMilestone),
    prizes: h.prizes.map(toPrize),
    teams: toTeamViews(h, now),
    openConflictCount,
  };
}
