import { prisma, type Prisma } from "@trellala/db";
import { addIstDays, startOfIstDay } from "../time";
import { isLiveTeam, openItemsForTeam } from "../rules/ranking";
import type {
  ActivityPage,
  ArchiveReason,
  HackathonDetail,
  HackathonListFilter,
  HackathonSummary,
  PersonView,
  PersonWithTeams,
  QueueGroup,
  QueueGroupKey,
  QueueItem,
  SearchEntry,
  TeamView,
  TimelineRow,
} from "../types";
import { hackathonInclude, num, toMilestone, toPerson, toProgress, userSelect } from "./mappers";
import { toDetail, toSummary, toTeamViews } from "./views";

/** Has a cash or crypto prize, or an estimated value above zero. */
const PRIZE_MONEY_WHERE: Prisma.HackathonWhereInput = {
  OR: [
    { estimatedUsd: { gt: 0 } },
    { prizes: { some: { kind: { not: "NON_MONETARY" }, OR: [{ amount: { gt: 0 } }, { estimatedUsd: { gt: 0 } }] } } },
  ],
};

function listWhere(f: Partial<HackathonListFilter>, archived: boolean): Prisma.HackathonWhereInput {
  return {
    archivedAt: archived ? { not: null } : null,
    ...(f.q ? { name: { contains: f.q, mode: "insensitive" } } : {}),
    ...(f.type ? { type: f.type } : {}),
    ...(f.mode ? { mode: f.mode } : {}),
    ...(f.stage ? { stage: f.stage } : {}),
    ...(f.tag ? { tags: { has: f.tag } } : {}),
    ...(f.member ? { teamMembers: { some: { userId: f.member } } } : {}),
    ...(f.prize ? PRIZE_MONEY_WHERE : {}),
  };
}

const SORTERS: Record<HackathonListFilter["sort"], (a: HackathonSummary, b: HackathonSummary) => number> = {
  deadline: (a, b) => (a.nextAction?.endsAt.getTime() ?? Infinity) - (b.nextAction?.endsAt.getTime() ?? Infinity),
  priority: (a, b) => b.priority - a.priority,
  prize: (a, b) => (b.estimatedUsd ?? -1) - (a.estimatedUsd ?? -1),
  added: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
};

export async function listHackathons(filter: HackathonListFilter, now = new Date()): Promise<HackathonSummary[]> {
  const rows = await prisma.hackathon.findMany({ where: listWhere(filter, false), include: hackathonInclude });
  return rows.map((h) => toSummary(h, now)).sort(SORTERS[filter.sort]);
}

export async function listArchived(reason?: ArchiveReason, now = new Date()): Promise<HackathonSummary[]> {
  const rows = await prisma.hackathon.findMany({
    where: { archivedAt: { not: null }, ...(reason ? { archiveReason: reason } : {}) },
    include: hackathonInclude,
    orderBy: { archivedAt: "desc" },
  });
  return rows.map((h) => toSummary(h, now));
}

export async function getHackathonDetail(id: string, now = new Date()): Promise<HackathonDetail | null> {
  const h = await prisma.hackathon.findUnique({
    where: { id },
    include: { ...hackathonInclude, archivedBy: { select: { name: true } } },
  });
  if (!h) return null;
  const openConflictCount = await prisma.conflict.count({ where: { hackathonId: id, status: "OPEN" } });
  return toDetail(h, openConflictCount, now);
}

export async function getTeamDetail(teamId: string, now = new Date()): Promise<{ team: TeamView; hackathon: HackathonDetail } | null> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { hackathonId: true } });
  if (!team) return null;
  const hackathon = await getHackathonDetail(team.hackathonId, now);
  const view = hackathon?.teams.find((t) => t.id === teamId);
  return hackathon && view ? { team: view, hackathon } : null;
}

function groupOf(endsAt: Date, now: Date): QueueGroupKey {
  if (endsAt.getTime() < now.getTime()) return "overdue";
  const today = startOfIstDay(now);
  if (endsAt < addIstDays(today, 1)) return "today";
  if (endsAt < addIstDays(today, 4)) return "soon";
  if (endsAt < addIstDays(today, 8)) return "week";
  return "later";
}

/** Overdue items plus the next upcoming item for every live team (or the hackathon, if it has no teams). */
export async function getActionQueue(opts: { userId?: string; tag?: string; prize?: boolean }, now = new Date()): Promise<QueueGroup[]> {
  const rows = await prisma.hackathon.findMany({
    where: {
      archivedAt: null,
      ...(opts.tag ? { tags: { has: opts.tag } } : {}),
      ...(opts.userId ? { teamMembers: { some: { userId: opts.userId } } } : {}),
      ...(opts.prize ? PRIZE_MONEY_WHERE : {}),
    },
    include: hackathonInclude,
  });

  const items: QueueItem[] = [];
  for (const h of rows) {
    const base = { hackathonId: h.id, hackathonName: h.name, hackathonType: h.type, mode: h.mode, tags: h.tags, sourceUrl: h.sourceUrl };
    const eventMilestones = h.milestones.map(toMilestone);
    const teams = toTeamViews(h, now);

    if (teams.length === 0 && !opts.userId) {
      const next = eventMilestones.filter((m) => m.requiresAction && m.endsAt >= now)[0];
      if (next) {
        items.push({
          ...base,
          id: `${h.id}:${next.id}`,
          teamId: null,
          teamName: null,
          teamStatus: null,
          members: [],
          milestoneId: next.id,
          title: next.title,
          action: next.action,
          endsAt: next.endsAt,
          isHardDeadline: next.isHardDeadline,
          teamOnly: false,
          overdue: false,
        });
      }
      continue;
    }

    for (const t of teams) {
      if (!isLiveTeam(t.status)) continue;
      if (opts.userId && !t.members.some((m) => m.id === opts.userId)) continue;
      const open = openItemsForTeam(t, eventMilestones, now);
      const picked = [...open.filter((a) => a.overdue), ...open.filter((a) => !a.overdue).slice(0, 1)];
      for (const a of picked) {
        items.push({
          ...base,
          id: `${t.id}:${a.milestoneId}`,
          teamId: t.id,
          teamName: t.name,
          teamStatus: t.status,
          members: t.members,
          milestoneId: a.milestoneId,
          title: a.title,
          action: a.action,
          endsAt: a.endsAt,
          isHardDeadline: a.isHardDeadline,
          teamOnly: a.teamOnly,
          overdue: a.overdue,
        });
      }
    }
  }

  items.sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const order: QueueGroupKey[] = ["overdue", "today", "soon", "week", "later"];
  return order
    .map((key) => ({ key, items: items.filter((i) => groupOf(i.endsAt, now) === key) }))
    .filter((g) => g.items.length > 0);
}

export async function getTimeline(): Promise<TimelineRow[]> {
  const rows = await prisma.hackathon.findMany({ where: { archivedAt: null }, include: hackathonInclude });
  return rows
    .map((h) => ({
      hackathonId: h.id,
      name: h.name,
      type: h.type,
      mode: h.mode,
      estimatedUsd: num(h.estimatedUsd),
      milestones: h.milestones.map(toMilestone),
      teams: h.teams.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        milestones: t.milestones.map(toMilestone),
        progress: t.progress.map(toProgress),
      })),
    }))
    .sort((a, b) => (a.milestones[0]?.endsAt.getTime() ?? Infinity) - (b.milestones[0]?.endsAt.getTime() ?? Infinity));
}

export async function listPeople(): Promise<PersonView[]> {
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { name: "asc" } });
  return users.map(toPerson);
}

export async function listPeopleWithTeams(): Promise<PersonWithTeams[]> {
  const users = await prisma.user.findMany({
    select: {
      ...userSelect,
      teamMemberships: {
        where: { hackathon: { archivedAt: null } },
        include: { team: { select: { id: true, name: true, status: true } }, hackathon: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    ...toPerson(u),
    teams: u.teamMemberships.map((m) => ({
      teamId: m.team.id,
      teamName: m.team.name,
      hackathonId: m.hackathon.id,
      hackathonName: m.hackathon.name,
      status: m.team.status,
    })),
  }));
}

export async function listTagSuggestions(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ tag: string }[]>`
    SELECT DISTINCT unnest("tags") AS tag FROM "Hackathon"
    UNION SELECT DISTINCT unnest("skills") AS tag FROM "user"
    ORDER BY tag`;
  return rows.map((r) => r.tag);
}

export async function listSearchIndex(): Promise<SearchEntry[]> {
  const rows = await prisma.hackathon.findMany({
    select: { id: true, name: true, type: true, archivedAt: true, tags: true },
    orderBy: [{ archivedAt: { sort: "asc", nulls: "first" } }, { updatedAt: "desc" }],
    take: 500,
  });
  return rows.map((h) => ({ id: h.id, name: h.name, type: h.type, archived: h.archivedAt !== null, tags: h.tags }));
}

export async function getProfile(userId: string): Promise<PersonView | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  return u ? toPerson(u) : null;
}

const ACTIVITY_PAGE = 50;

export async function listActivity(f: {
  actorType?: "USER" | "API_KEY" | "SYSTEM";
  actorUserId?: string;
  actorApiKeyId?: string;
  action?: string;
  hackathonId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
}): Promise<ActivityPage> {
  const rows = await prisma.activityLog.findMany({
    where: {
      ...(f.actorType ? { actorType: f.actorType } : {}),
      ...(f.actorUserId ? { actorUserId: f.actorUserId } : {}),
      ...(f.actorApiKeyId ? { actorApiKeyId: f.actorApiKeyId } : {}),
      ...(f.action ? { action: { startsWith: f.action } } : {}),
      ...(f.hackathonId ? { hackathonId: f.hackathonId } : {}),
      ...(f.from || f.to ? { createdAt: { ...(f.from ? { gte: f.from } : {}), ...(f.to ? { lte: f.to } : {}) } } : {}),
    },
    include: {
      actorUser: { select: { name: true } },
      actorApiKey: { select: { name: true } },
      hackathon: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: ACTIVITY_PAGE + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, ACTIVITY_PAGE);
  return {
    items: page.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      hackathonId: r.hackathonId,
      hackathonName: r.hackathon?.name ?? null,
      actorType: r.actorType,
      actorName: r.actorType === "SYSTEM" ? "System" : (r.actorUser?.name ?? r.actorApiKey?.name ?? "Unknown"),
      before: r.before,
      after: r.after,
      note: r.note,
      createdAt: r.createdAt,
    })),
    nextCursor: rows.length > ACTIVITY_PAGE ? (page.at(-1)?.id ?? null) : null,
  };
}
