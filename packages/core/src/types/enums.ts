import type {
  ACTOR_TYPES,
  ARCHIVE_REASONS,
  AUTO_ARCHIVE_REASONS,
  CONFLICT_STATUSES,
  HACKATHON_MODES,
  HACKATHON_STAGES,
  HACKATHON_TYPES,
  INGEST_STATUSES,
  MANUAL_ARCHIVE_REASONS,
  MILESTONE_KINDS,
  PRIZE_KINDS,
  TEAM_MILESTONE_STATES,
  TEAM_STATUSES,
} from "../constants/enums";

export type HackathonType = (typeof HACKATHON_TYPES)[number];
export type HackathonMode = (typeof HACKATHON_MODES)[number];
export type HackathonStage = (typeof HACKATHON_STAGES)[number];
export type PrizeKind = (typeof PRIZE_KINDS)[number];
export type MilestoneKind = (typeof MILESTONE_KINDS)[number];
export type TeamStatus = (typeof TEAM_STATUSES)[number];
export type TeamMilestoneState = (typeof TEAM_MILESTONE_STATES)[number];
export type ArchiveReason = (typeof ARCHIVE_REASONS)[number];
export type ManualArchiveReason = (typeof MANUAL_ARCHIVE_REASONS)[number];
export type AutoArchiveReason = (typeof AUTO_ARCHIVE_REASONS)[number];
export type IngestStatus = (typeof INGEST_STATUSES)[number];
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];
export type ActorType = (typeof ACTOR_TYPES)[number];
