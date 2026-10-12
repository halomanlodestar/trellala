/** @format */

import {
  AUTO_ARCHIVE_REASONS,
  TEAM_LIVE_STATUSES,
  TEAM_OUT_STATUSES,
} from "../constants/enums";
import type {
  ArchiveReason,
  AutoArchiveReason,
  MilestoneKind,
  TeamMilestoneState,
  TeamStatus,
} from "../types";

export type ArchiveSnapshot = {
  archivedAt: Date | null;
  archiveReason: ArchiveReason | null;
  archivedById: string | null;
  eventMilestones: {
    id: string;
    kind: MilestoneKind;
    endsAt: Date;
    requiresAction: boolean;
    isHardDeadline: boolean;
  }[];
  teams: {
    id: string;
    status: TeamStatus;
    createdAt: Date;
    progress: { milestoneId: string; state: TeamMilestoneState }[];
  }[];
};

export type ArchiveDecision = {
  markMissed: { teamId: string; milestoneId: string }[];
  revertMissed: { teamId: string; milestoneId: string }[];
  teamsToMissed: string[];
  teamsToActive: string[];
  /** Archive (or switch auto reason) with this reason. */
  archive: AutoArchiveReason | null;
  unarchive: boolean;
};

const isLive = (s: TeamStatus) =>
  (TEAM_LIVE_STATUSES as readonly string[]).includes(s);
const isOut = (s: TeamStatus) =>
  (TEAM_OUT_STATUSES as readonly string[]).includes(s);

/**
 * Pure archive rules, applied in order:
 * 1. Live teams that haven't done a passed hard event deadline → MISSED (only deadlines after the team was created).
 *    Deadlines moved into the future revert MISSED.
 * 2. NO_TEAM_REGISTERED, 3. ALL_TEAMS_OUT, 4. CONCLUDED.
 * System archives are undone when their rule no longer holds; manual archives are never touched.
 */
export function decideArchive(s: ArchiveSnapshot, now: Date): ArchiveDecision {
  const d: ArchiveDecision = {
    markMissed: [],
    revertMissed: [],
    teamsToMissed: [],
    teamsToActive: [],
    archive: null,
    unarchive: false,
  };
  const hard = s.eventMilestones.filter(
    (m) => m.requiresAction && m.isHardDeadline,
  );
  const finalStatus = new Map<string, TeamStatus>();

  for (const team of s.teams) {
    const progress = new Map(
      team.progress.map((p) => [p.milestoneId, p.state]),
    );
    let missedCount = 0;
    let newlyMissed = 0;

    for (const m of hard) {
      const state = progress.get(m.id) ?? "TODO";
      const passed = m.endsAt.getTime() <= now.getTime();
      if (state === "MISSED") {
        if (!passed)
          d.revertMissed.push({ teamId: team.id, milestoneId: m.id });
        else missedCount++;
      } else if (
        isLive(team.status) &&
        state !== "DONE" &&
        passed &&
        m.endsAt.getTime() > team.createdAt.getTime()
      ) {
        d.markMissed.push({ teamId: team.id, milestoneId: m.id });
        newlyMissed++;
        missedCount++;
      }
    }

    let status = team.status;
    if (isLive(status) && newlyMissed > 0) {
      d.teamsToMissed.push(team.id);
      status = "MISSED";
    } else if (status === "MISSED" && missedCount === 0) {
      d.teamsToActive.push(team.id);
      status = "ACTIVE";
    }
    finalStatus.set(team.id, status);
  }

  const reason = autoReason(s, finalStatus, now);
  const isSystemArchive =
    s.archivedAt !== null &&
    s.archivedById === null &&
    s.archiveReason !== null &&
    (AUTO_ARCHIVE_REASONS as readonly string[]).includes(s.archiveReason);

  if (s.archivedAt === null) {
    d.archive = reason;
  } else if (isSystemArchive) {
    if (reason === null) d.unarchive = true;
    else if (reason !== s.archiveReason) d.archive = reason;
  }
  return d;
}

function autoReason(
  s: ArchiveSnapshot,
  statuses: Map<string, TeamStatus>,
  now: Date,
): AutoArchiveReason | null {
  const ended = (m: { endsAt: Date }) => m.endsAt.getTime() <= now.getTime();

  if (s.teams.length === 0) {
    const registration =
      s.eventMilestones.find((m) => m.kind === "REGISTRATION") ??
      [...s.eventMilestones]
        .filter((m) => m.requiresAction && m.isHardDeadline)
        .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())[0];
    if (registration && ended(registration)) return "NO_TEAM_REGISTERED";
  } else if ([...statuses.values()].every(isOut)) {
    return "ALL_TEAMS_OUT";
  }

  if (s.eventMilestones.length > 0 && s.eventMilestones.every(ended))
    return "CONCLUDED";
  return null;
}
