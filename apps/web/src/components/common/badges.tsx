import {
  ARCHIVE_REASON_LABEL,
  HACKATHON_MODE_LABEL,
  HACKATHON_STAGE_LABEL,
  HACKATHON_TYPE_LABEL,
  TEAM_STATUS_LABEL,
} from "@trellala/core/constants";
import type { ArchiveReason, HackathonMode, HackathonStage, HackathonType, TeamStatus } from "@trellala/core/types";
import { cn } from "@/lib/utils";

// Printed-label style: small mono caps, no fills. Only outcomes get colour.

const label = "caps inline-flex items-center gap-1 whitespace-nowrap";

export function TypeBadge({ type }: { type: HackathonType }) {
  return <span className={cn(label, "text-foreground")}>{HACKATHON_TYPE_LABEL[type]}</span>;
}

export function ModeBadge({ mode }: { mode: HackathonMode }) {
  return <span className={cn(label, "text-muted-foreground")}>{HACKATHON_MODE_LABEL[mode]}</span>;
}

/** "Buildathon · Online" on one line. */
export function KindLine({ type, mode, className }: { type: HackathonType; mode: HackathonMode; className?: string }) {
  return (
    <span className={cn(label, "text-muted-foreground", className)}>
      <span className="text-foreground">{HACKATHON_TYPE_LABEL[type]}</span>
      <span aria-hidden>·</span>
      {HACKATHON_MODE_LABEL[mode]}
    </span>
  );
}

export function StageBadge({ stage }: { stage: HackathonStage }) {
  return <span className={cn(label, "text-muted-foreground")}>{HACKATHON_STAGE_LABEL[stage]}</span>;
}

const STATUS_COLOR: Partial<Record<TeamStatus, string>> = {
  MISSED: "text-destructive border-destructive/40",
  ELIMINATED: "text-destructive border-destructive/40",
  WITHDRAWN: "text-muted-foreground",
  WON: "text-done border-done/50",
  SHORTLISTED: "text-foreground border-rule",
  SUBMITTED: "text-foreground border-rule",
};

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  return <span className={cn(label, "rounded-sm border px-1.5 py-px", STATUS_COLOR[status])}>{TEAM_STATUS_LABEL[status]}</span>;
}

export function ArchiveReasonBadge({ reason }: { reason: ArchiveReason | null }) {
  if (!reason) return null;
  return <span className={cn(label, "text-muted-foreground")}>{ARCHIVE_REASON_LABEL[reason]}</span>;
}

export function Tags({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground", className)}>
      {tags.map((t) => (
        <span key={t}>#{t}</span>
      ))}
    </span>
  );
}
