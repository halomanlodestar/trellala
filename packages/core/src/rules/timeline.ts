import type {
  MilestoneView,
  TeamMarkState,
  TeamMilestoneState,
  TimelineLane,
  TimelineMarkKind,
  TimelineRow,
  TimelineTeam,
} from "../types";
import { hackathonNextAction } from "./ranking";

export const markKind = (m: Pick<MilestoneView, "requiresAction" | "isHardDeadline">): TimelineMarkKind =>
  m.requiresAction ? (m.isHardDeadline ? "hard" : "action") : "info";

/**
 * A team's standing on one action. A hard deadline that has passed still TODO reads as
 * missed even before the archive sweep records it; a soft one reads as late.
 */
export function teamMarkState(
  state: TeamMilestoneState | undefined,
  m: Pick<MilestoneView, "endsAt" | "isHardDeadline">,
  now: Date,
): TeamMarkState {
  if (state === "DONE") return "done";
  if (state === "SKIPPED") return "skipped";
  if (state === "MISSED") return "missed";
  if (m.endsAt.getTime() >= now.getTime()) return "todo";
  return m.isHardDeadline ? "missed" : "late";
}

const byEnd = (a: { endsAt: Date }, b: { endsAt: Date }) => a.endsAt.getTime() - b.endsAt.getTime();

function toTeam(team: TimelineRow["teams"][number], eventMilestones: MilestoneView[], now: Date): TimelineTeam {
  const progress = new Map(team.progress.map((p) => [p.milestoneId, p.state]));
  const actions = [...eventMilestones.filter((m) => m.requiresAction), ...team.milestones].sort(byEnd);
  const marks = actions.map((m) => ({
    milestoneId: m.id,
    title: m.title,
    at: m.endsAt,
    state: teamMarkState(progress.get(m.id), m, now),
    teamOnly: m.teamId !== null,
  }));
  return {
    id: team.id,
    name: team.name,
    status: team.status,
    missed: marks.some((k) => k.state === "missed"),
    done: marks.filter((k) => k.state === "done" || k.state === "skipped").length,
    total: marks.length,
    marks,
  };
}

/**
 * Timeline lanes, soonest next action first. Milestones with a start become phases;
 * point milestones, and phases that end in an action, become deadline marks.
 */
export function buildTimelineLanes(rows: TimelineRow[], now: Date): TimelineLane[] {
  const lanes = rows.map((r): TimelineLane => {
    const milestones = [...r.milestones].sort(byEnd);
    return {
      hackathonId: r.hackathonId,
      name: r.name,
      type: r.type,
      mode: r.mode,
      estimatedUsd: r.estimatedUsd,
      phases: milestones
        .filter((m): m is MilestoneView & { startsAt: Date } => m.startsAt !== null)
        .map((m) => ({ milestoneId: m.id, title: m.title, startsAt: m.startsAt, endsAt: m.endsAt })),
      marks: milestones
        .filter((m) => m.startsAt === null || m.requiresAction)
        .map((m) => ({ milestoneId: m.id, title: m.title, at: m.endsAt, kind: markKind(m) })),
      next: hackathonNextAction(r.teams, milestones, now),
      teams: r.teams.map((t) => toTeam(t, milestones, now)),
    };
  });
  const key = (l: TimelineLane) => l.next?.endsAt.getTime() ?? Infinity;
  return lanes.sort((a, b) => key(a) - key(b));
}
