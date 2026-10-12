import type { Prisma } from "@trellala/db";
import type { Milestone, Prize, TeamMilestone, User } from "@trellala/db";
import type { MilestoneView, PersonView, PrizeView, ProgressView } from "../types";

export const num = (d: Prisma.Decimal | null): number | null => (d === null ? null : d.toNumber());

export const toPerson = (u: Pick<User, "id" | "name" | "email" | "image" | "skills">): PersonView => ({
  id: u.id,
  name: u.name,
  email: u.email,
  image: u.image,
  skills: u.skills,
});

export const toMilestone = (m: Milestone): MilestoneView => ({
  id: m.id,
  key: m.key,
  kind: m.kind,
  title: m.title,
  action: m.action,
  startsAt: m.startsAt,
  endsAt: m.endsAt,
  sourceTimezone: m.sourceTimezone,
  requiresAction: m.requiresAction,
  isHardDeadline: m.isHardDeadline,
  teamId: m.teamId,
});

export const toPrize = (p: Prize): PrizeView => ({
  id: p.id,
  key: p.key,
  title: p.title,
  kind: p.kind,
  amount: num(p.amount),
  currency: p.currency,
  description: p.description,
  estimatedUsd: num(p.estimatedUsd),
});

export const toProgress = (p: TeamMilestone): ProgressView => ({
  milestoneId: p.milestoneId,
  state: p.state,
  proofUrl: p.proofUrl,
  note: p.note,
  completedAt: p.completedAt,
});

/** "₹50,000 · 2 ETH · Swag" style summary. */
export function prizeSummary(prizes: PrizeView[]): string | null {
  if (prizes.length === 0) return null;
  const totals = new Map<string, number>();
  let nonMonetary = 0;
  for (const p of prizes) {
    if (p.kind === "NON_MONETARY" || p.amount === null) {
      nonMonetary++;
      continue;
    }
    const cur = p.currency ?? "USD";
    totals.set(cur, (totals.get(cur) ?? 0) + p.amount);
  }
  const parts = [...totals.entries()].map(([cur, amt]) => `${formatAmount(amt)} ${cur}`);
  if (nonMonetary > 0) parts.push(nonMonetary === 1 ? "+1 perk" : `+${nonMonetary} perks`);
  return parts.join(" · ");
}

function formatAmount(n: number): string {
  if (n >= 1e7) return `${+(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${+(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}K`;
  return `${+n.toFixed(2)}`;
}

export const userSelect = { id: true, name: true, email: true, image: true, skills: true } as const;

export const hackathonInclude = {
  milestones: { where: { teamId: null }, orderBy: { endsAt: "asc" } },
  prizes: { orderBy: { sortOrder: "asc" } },
  teams: {
    orderBy: { createdAt: "asc" },
    include: {
      members: { include: { user: { select: userSelect } }, orderBy: { joinedAt: "asc" } },
      progress: true,
      milestones: { orderBy: { endsAt: "asc" } },
    },
  },
} as const satisfies Prisma.HackathonInclude;

export type HackathonWithRelations = Prisma.HackathonGetPayload<{ include: typeof hackathonInclude }>;
