"use client";

import { PROGRESS_STATE_LABEL } from "@trellala/core/constants";
import type { MilestoneView, TeamView } from "@trellala/core/types";
import { Check, Circle, CircleSlash, Lock, RotateCcw, SkipForward, Trash2, XCircle } from "lucide-react";
import { Deadline } from "@/components/common/deadline";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTeamMilestone } from "@/hooks/use-delete-team-milestone";
import { useSetProgress } from "@/hooks/use-set-progress";
import { cn } from "@/lib/utils";

type Props = { team: TeamView; eventMilestones: MilestoneView[] };

const STATE_ICON = { TODO: Circle, DONE: Check, SKIPPED: CircleSlash, MISSED: XCircle } as const;

export function MilestoneChecklist({ team, eventMilestones }: Props) {
  const progress = new Map(team.progress.map((p) => [p.milestoneId, p.state]));
  const items = [...eventMilestones.filter((m) => m.requiresAction), ...team.milestones].sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const setProgress = useSetProgress();
  const deleteMilestone = useDeleteTeamMilestone({ success: "Removed" });
  const pending = setProgress.isPending || deleteMilestone.isPending;

  if (items.length === 0) return <p className="text-sm text-muted-foreground">No actions</p>;

  return (
    <ul className="flex flex-col divide-y">
      {items.map((m) => {
        const state = progress.get(m.id) ?? "TODO";
        const Icon = STATE_ICON[state];
        const set = (s: "TODO" | "DONE" | "SKIPPED") => setProgress.mutate({ teamId: team.id, milestoneId: m.id, state: s });
        return (
          <li key={m.id} className={cn("flex items-center gap-3 py-2", state === "MISSED" && "text-destructive")}>
            <Icon className={cn("size-4 shrink-0", state === "DONE" && "text-emerald-600", state === "TODO" && "text-muted-foreground")} aria-label={PROGRESS_STATE_LABEL[state]} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={cn("flex items-center gap-1.5 text-sm", (state === "DONE" || state === "SKIPPED") && "text-muted-foreground line-through")}>
                {m.title}
                {m.isHardDeadline && <Lock className="size-3" />}
                {m.teamId && <span className="text-xs text-muted-foreground no-underline">team</span>}
              </span>
              {m.action && <span className="truncate text-xs text-muted-foreground">{m.action}</span>}
            </div>
            {state === "TODO" && <Deadline at={m.endsAt} className="text-xs" />}
            <div className="flex gap-0.5">
              {state === "TODO" || state === "MISSED" ? (
                <>
                  <IconButton label="Done" icon={Check} disabled={pending} onClick={() => set("DONE")} />
                  {state === "TODO" && <IconButton label="Skip" icon={SkipForward} disabled={pending} onClick={() => set("SKIPPED")} />}
                </>
              ) : (
                <IconButton label="Reopen" icon={RotateCcw} disabled={pending} onClick={() => set("TODO")} />
              )}
              {m.teamId && (
                <IconButton
                  label="Delete"
                  icon={Trash2}
                  disabled={pending}
                  onClick={() => confirm("Delete this team milestone?") && deleteMilestone.mutate({ milestoneId: m.id })}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function IconButton({ label, icon: Icon, onClick, disabled }: { label: string; icon: typeof Check; onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" className="size-7" aria-label={label} disabled={disabled} onClick={onClick}>
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
