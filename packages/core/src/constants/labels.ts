import type {
  ArchiveReason,
  HackathonMode,
  HackathonStage,
  HackathonType,
  MilestoneKind,
  PrizeKind,
  TeamMilestoneState,
  TeamStatus,
} from "../types/enums";

export const HACKATHON_TYPE_LABEL: Record<HackathonType, string> = {
  BUILDATHON: "Buildathon",
  IDEATHON: "Ideathon",
  CTF: "CTF",
  DSA: "DSA",
  GRANT: "Grant",
  BOUNTY: "Bounty",
  OTHER: "Other",
};

export const HACKATHON_MODE_LABEL: Record<HackathonMode, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrid",
};

export const HACKATHON_STAGE_LABEL: Record<HackathonStage, string> = {
  DISCOVERED: "Discovered",
  EVALUATING: "Evaluating",
  COMMITTED: "Committed",
};

export const PRIZE_KIND_LABEL: Record<PrizeKind, string> = {
  CASH: "Cash",
  CRYPTO: "Crypto",
  NON_MONETARY: "Non-monetary",
};

export const MILESTONE_KIND_LABEL: Record<MilestoneKind, string> = {
  REGISTRATION: "Registration",
  TEAM_FORMATION: "Team formation",
  IDEA_SUBMISSION: "Idea submission",
  SHORTLIST: "Shortlist",
  ROUND: "Round",
  PROTOTYPE: "Prototype",
  FINAL_SUBMISSION: "Final submission",
  DEMO: "Demo",
  EVENT_START: "Event start",
  EVENT_END: "Event end",
  RESULTS: "Results",
  REPORT: "Report",
  PAYOUT: "Payout",
  CUSTOM: "Custom",
};

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  ACTIVE: "Active",
  SUBMITTED: "Submitted",
  SHORTLISTED: "Shortlisted",
  MISSED: "Missed",
  ELIMINATED: "Eliminated",
  WITHDRAWN: "Withdrawn",
  WON: "Won",
  LOST: "Lost",
};

export const PROGRESS_STATE_LABEL: Record<TeamMilestoneState, string> = {
  TODO: "To do",
  DONE: "Done",
  SKIPPED: "Skipped",
  MISSED: "Missed",
};

export const ARCHIVE_REASON_LABEL: Record<ArchiveReason, string> = {
  SKILL_MISMATCH: "Skill mismatch",
  LOW_PRIZE: "Low prize",
  NO_TIME: "No time",
  NOT_INTERESTED: "Not interested",
  OTHER: "Other",
  CONCLUDED: "Concluded",
  ALL_TEAMS_OUT: "All teams out",
  NO_TEAM_REGISTERED: "No team registered",
};
