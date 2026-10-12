// String tuples mirroring the Prisma enums. Client-safe (no Prisma import);
// server code asserts they stay in sync in ../server/enum-sync.ts.

export const HACKATHON_TYPES = ["BUILDATHON", "IDEATHON", "CTF", "DSA", "GRANT", "BOUNTY", "OTHER"] as const;
export const HACKATHON_MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const HACKATHON_STAGES = ["DISCOVERED", "EVALUATING", "COMMITTED"] as const;
export const PRIZE_KINDS = ["CASH", "CRYPTO", "NON_MONETARY"] as const;

export const MILESTONE_KINDS = [
  "REGISTRATION",
  "TEAM_FORMATION",
  "IDEA_SUBMISSION",
  "SHORTLIST",
  "ROUND",
  "PROTOTYPE",
  "FINAL_SUBMISSION",
  "DEMO",
  "EVENT_START",
  "EVENT_END",
  "RESULTS",
  "REPORT",
  "PAYOUT",
  "CUSTOM",
] as const;

export const TEAM_STATUSES = [
  "ACTIVE",
  "SUBMITTED",
  "SHORTLISTED",
  "MISSED",
  "ELIMINATED",
  "WITHDRAWN",
  "WON",
  "LOST",
] as const;

/** Statuses that mean the team can no longer continue. */
export const TEAM_OUT_STATUSES = ["MISSED", "ELIMINATED", "WITHDRAWN"] as const;
/** Statuses where the team is still competing. */
export const TEAM_LIVE_STATUSES = ["ACTIVE", "SUBMITTED", "SHORTLISTED"] as const;

export const TEAM_MILESTONE_STATES = ["TODO", "DONE", "SKIPPED", "MISSED"] as const;
/** States a person may set; MISSED is set by the archive rules. */
export const SETTABLE_PROGRESS_STATES = ["TODO", "DONE", "SKIPPED"] as const;

export const MANUAL_ARCHIVE_REASONS = ["SKILL_MISMATCH", "LOW_PRIZE", "NO_TIME", "NOT_INTERESTED", "OTHER"] as const;
export const AUTO_ARCHIVE_REASONS = ["CONCLUDED", "ALL_TEAMS_OUT", "NO_TEAM_REGISTERED"] as const;
export const ARCHIVE_REASONS = [...MANUAL_ARCHIVE_REASONS, ...AUTO_ARCHIVE_REASONS] as const;

export const INGEST_STATUSES = ["QUEUED", "PROCESSING", "APPLIED", "PARTIAL", "NO_CHANGE", "FAILED"] as const;
export const CONFLICT_STATUSES = ["OPEN", "RESOLVED"] as const;
export const ACTOR_TYPES = ["USER", "API_KEY", "SYSTEM"] as const;
