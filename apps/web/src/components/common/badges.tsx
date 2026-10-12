/** @format */

import {
  ARCHIVE_REASON_LABEL,
  HACKATHON_MODE_LABEL,
  HACKATHON_STAGE_LABEL,
  HACKATHON_TYPE_LABEL,
  TEAM_STATUS_LABEL,
} from "@trellala/core/constants";
import type {
  ArchiveReason,
  HackathonMode,
  HackathonStage,
  HackathonType,
  TeamStatus,
} from "@trellala/core/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_COLOR: Record<HackathonType, string> = {
  BUILDATHON: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  IDEATHON: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  CTF: "bg-red-500/10 text-red-700 dark:text-red-300",
  DSA: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  GRANT: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  BOUNTY: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  OTHER: "bg-muted text-muted-foreground",
};

export function TypeBadge({ type }: { type: HackathonType }) {
  return (
    <Badge variant="secondary" className={cn("border-0", TYPE_COLOR[type])}>
      {HACKATHON_TYPE_LABEL[type]}
    </Badge>
  );
}

export function ModeBadge({ mode }: { mode: HackathonMode }) {
  return <Badge variant="outline">{HACKATHON_MODE_LABEL[mode]}</Badge>;
}

export function StageBadge({ stage }: { stage: HackathonStage }) {
  return <Badge variant="outline">{HACKATHON_STAGE_LABEL[stage]}</Badge>;
}

const STATUS_COLOR: Partial<Record<TeamStatus, string>> = {
  MISSED: "bg-destructive/10 text-destructive",
  ELIMINATED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground",
  WON: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  SHORTLISTED: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  SUBMITTED: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0", STATUS_COLOR[status])}>
      {TEAM_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ArchiveReasonBadge({
  reason,
}: {
  reason: ArchiveReason | null;
}) {
  if (!reason) return null;

  return <Badge variant="secondary">{ARCHIVE_REASON_LABEL[reason]}</Badge>;
}

export function Tags({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((t) => (
        <span
          key={t}
          className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
