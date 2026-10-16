// Read models returned by core queries. Plain data, safe to pass to client components.
import type {
  ActorType,
  ArchiveReason,
  ConflictStatus,
  HackathonMode,
  HackathonStage,
  HackathonType,
  IngestStatus,
  MilestoneKind,
  PrizeKind,
  TeamMilestoneState,
  TeamStatus,
} from "./enums";

export type PersonView = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  skills: string[];
};

export type PersonWithTeams = PersonView & {
  teams: { teamId: string; teamName: string; hackathonId: string; hackathonName: string; status: TeamStatus }[];
};

export type MilestoneView = {
  id: string;
  key: string;
  kind: MilestoneKind;
  title: string;
  action: string | null;
  startsAt: Date | null;
  endsAt: Date;
  sourceTimezone: string | null;
  requiresAction: boolean;
  isHardDeadline: boolean;
  teamId: string | null;
};

export type PrizeView = {
  id: string;
  key: string;
  title: string;
  kind: PrizeKind;
  amount: number | null;
  currency: string | null;
  description: string | null;
  estimatedUsd: number | null;
};

export type ProgressView = {
  milestoneId: string;
  state: TeamMilestoneState;
  proofUrl: string | null;
  note: string | null;
  completedAt: Date | null;
};

export type TeamView = {
  id: string;
  hackathonId: string;
  name: string;
  ideaTitle: string | null;
  ideaDescription: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  submissionUrl: string | null;
  status: TeamStatus;
  wonPrizeId: string | null;
  createdAt: Date;
  members: PersonView[];
  progress: ProgressView[];
  milestones: MilestoneView[];
  nextAction: NextAction | null;
};

export type NextAction = {
  milestoneId: string;
  title: string;
  kind: MilestoneKind;
  action: string | null;
  endsAt: Date;
  isHardDeadline: boolean;
  teamId: string | null;
  teamOnly: boolean;
  overdue: boolean;
};

export type HackathonSummary = {
  id: string;
  name: string;
  type: HackathonType;
  mode: HackathonMode;
  location: string | null;
  stage: HackathonStage;
  tags: string[];
  sourceUrl: string | null;
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  estimatedUsd: number | null;
  prizeSummary: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  archiveReason: ArchiveReason | null;
  teamCount: number;
  members: PersonView[];
  nextAction: NextAction | null;
  priority: number;
  hasMissedTeam: boolean;
  /** First start (or deadline) to last deadline of the event timeline. */
  span: { start: Date; end: Date } | null;
  milestoneCount: number;
};

export type HackathonDetail = HackathonSummary & {
  description: string | null;
  eligibility: string | null;
  effortEstimate: number | null;
  fitScore: number | null;
  notes: string | null;
  source: string | null;
  externalId: string | null;
  fieldSources: Record<string, string>;
  archiveNote: string | null;
  archivedByName: string | null;
  milestones: MilestoneView[];
  prizes: PrizeView[];
  teams: TeamView[];
  openConflictCount: number;
};

export type QueueItem = {
  id: string;
  hackathonId: string;
  hackathonName: string;
  hackathonType: HackathonType;
  mode: HackathonMode;
  tags: string[];
  teamId: string | null;
  teamName: string | null;
  teamStatus: TeamStatus | null;
  members: PersonView[];
  milestoneId: string;
  title: string;
  action: string | null;
  endsAt: Date;
  isHardDeadline: boolean;
  teamOnly: boolean;
  overdue: boolean;
};

export type QueueGroupKey = "overdue" | "today" | "soon" | "week" | "later";

export type QueueGroup = { key: QueueGroupKey; items: QueueItem[] };

export type TimelineRow = {
  hackathonId: string;
  name: string;
  type: HackathonType;
  mode: HackathonMode;
  estimatedUsd: number | null;
  milestones: MilestoneView[];
  teams: { id: string; name: string; status: TeamStatus; milestones: MilestoneView[]; progress: ProgressView[] }[];
};

/** How a deadline tick is drawn: hard action, ordinary action, or informational. */
export type TimelineMarkKind = "hard" | "action" | "info";

/** A team's standing on one action. `late` = past a soft deadline, still TODO. */
export type TeamMarkState = "done" | "skipped" | "missed" | "late" | "todo";

export type TimelinePhase = { milestoneId: string; title: string; startsAt: Date; endsAt: Date };

export type TimelineMark = { milestoneId: string; title: string; at: Date; kind: TimelineMarkKind };

export type TimelineTeamMark = { milestoneId: string; title: string; at: Date; state: TeamMarkState; teamOnly: boolean };

export type TimelineTeam = {
  id: string;
  name: string;
  status: TeamStatus;
  missed: boolean;
  done: number;
  total: number;
  marks: TimelineTeamMark[];
};

/** One hackathon's row on the timeline: phases as spans, deadlines as ticks, plus per-team standing. */
export type TimelineLane = {
  hackathonId: string;
  name: string;
  type: HackathonType;
  mode: HackathonMode;
  estimatedUsd: number | null;
  phases: TimelinePhase[];
  marks: TimelineMark[];
  next: NextAction | null;
  teams: TimelineTeam[];
};

export type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  hackathonId: string | null;
  hackathonName: string | null;
  actorType: ActorType;
  actorName: string;
  before: unknown;
  after: unknown;
  note: string | null;
  createdAt: Date;
};

export type ActivityPage = { items: ActivityItem[]; nextCursor: string | null };

export type ConflictCandidateView = {
  id: string;
  source: string;
  value: unknown;
  receivedAt: Date;
  ingestEventId: string | null;
};

export type ConflictSummary = {
  id: string;
  hackathonId: string;
  hackathonName: string;
  fieldPath: string;
  status: ConflictStatus;
  currentValue: unknown;
  currentSource: string | null;
  candidateCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ConflictDetail = ConflictSummary & {
  candidates: ConflictCandidateView[];
  resolvedValue: unknown;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  note: string | null;
};

export type IngestEventView = {
  id: string;
  source: string;
  externalId: string | null;
  sourceUrl: string | null;
  status: IngestStatus;
  hackathonId: string | null;
  hackathonName: string | null;
  apiKeyName: string | null;
  payload: unknown;
  result: unknown;
  error: string | null;
  attempts: number;
  createdAt: Date;
  processedAt: Date | null;
};

export type ApiKeyView = {
  id: string;
  name: string;
  source: string;
  prefix: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdByName: string;
};

export type CreatedApiKey = { apiKey: ApiKeyView; token: string };

export type ReviewCounts = { conflicts: number; failed: number };

export type IngestItemResult =
  | { index: number; status: "queued"; eventId: string }
  | { index: number; status: "invalid"; eventId: string; issues: unknown };

export type SessionUser = { id: string; name: string; email: string; image: string | null };

export type SearchEntry = { id: string; name: string; type: HackathonType; archived: boolean; tags: string[] };
