/** @format */

import { TEAM_LIVE_STATUSES } from "../constants/enums";
import type {
  MilestoneView,
  NextAction,
  ProgressView,
  TeamStatus,
} from "../types";

export type RankTeam = {
  id: string;
  status: TeamStatus;
  progress: Pick<ProgressView, "milestoneId" | "state">[];
  milestones: MilestoneView[];
};

const DONE_STATES = new Set(["DONE", "SKIPPED", "MISSED"]);

const toAction = (
  m: MilestoneView,
  teamId: string | null,
  now: Date,
): NextAction => ({
  milestoneId: m.id,
  title: m.title,
  kind: m.kind,
  action: m.action,
  endsAt: m.endsAt,
  isHardDeadline: m.isHardDeadline,
  teamId,
  teamOnly: m.teamId !== null,
  overdue: m.endsAt.getTime() < now.getTime(),
});

export const isLiveTeam = (status: TeamStatus) =>
  (TEAM_LIVE_STATUSES as readonly string[]).includes(status);

/** Every open action item for a team, earliest first (overdue ones included). */
export function openItemsForTeam(
  team: RankTeam,
  eventMilestones: MilestoneView[],
  now: Date,
): NextAction[] {
  const state = new Map(team.progress.map((p) => [p.milestoneId, p.state]));
  return [...eventMilestones, ...team.milestones]
    .filter(
      (m) => m.requiresAction && !DONE_STATES.has(state.get(m.id) ?? "TODO"),
    )
    .map((m) => toAction(m, team.id, now))
    .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
}

export function teamNextAction(
  team: RankTeam,
  eventMilestones: MilestoneView[],
  now: Date,
): NextAction | null {
  if (!isLiveTeam(team.status)) return null;
  return (
    openItemsForTeam(team, eventMilestones, now).find((a) => !a.overdue) ?? null
  );
}

/** Earliest next action across live teams; with no teams, the earliest upcoming event action. */
export function hackathonNextAction(
  teams: RankTeam[],
  eventMilestones: MilestoneView[],
  now: Date,
): NextAction | null {
  if (teams.length === 0) {
    const next = eventMilestones
      .filter((m) => m.requiresAction && m.endsAt.getTime() >= now.getTime())
      .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())[0];
    return next ? toAction(next, null, now) : null;
  }
  const actions = teams
    .map((t) => teamNextAction(t, eventMilestones, now))
    .filter((a): a is NextAction => a !== null);
  return (
    actions.sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())[0] ?? null
  );
}

export const PRIORITY_WEIGHTS = {
  urgency: 50,
  value: 30,
  fit: 15,
  effort: 10,
} as const;

/** 0–100ish. Urgency climbs steeply inside 48h; value is log-scaled USD. */
export function priorityScore(input: {
  nextAction: NextAction | null;
  estimatedUsd: number | null;
  fitScore: number | null;
  effortEstimate: number | null;
  now: Date;
}): number {
  const hours = input.nextAction
    ? (input.nextAction.endsAt.getTime() - input.now.getTime()) / 36e5
    : Infinity;
  const urgency =
    hours === Infinity ? 0 : hours <= 0 ? 1 : 1 / (1 + hours / 24);
  const value = input.estimatedUsd
    ? Math.min(Math.log10(1 + input.estimatedUsd) / 6, 1)
    : 0;
  const fit = input.fitScore ? (input.fitScore - 1) / 4 : 0.5;
  const effort = input.effortEstimate
    ? Math.min(input.effortEstimate / 80, 1)
    : 0.25;
  const w = PRIORITY_WEIGHTS;
  return (
    Math.round(
      (w.urgency * urgency +
        w.value * value +
        w.fit * fit -
        w.effort * effort) *
        10,
    ) / 10
  );
}
