"use client";

import { Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSetProgress } from "@/hooks/use-set-progress";

type Props = { teamId: string; milestoneId: string; onHide?: () => void; onRestore?: () => void };

export function QueueItemActions({ teamId, milestoneId, onHide, onRestore }: Props) {
  const mutation = useSetProgress({ success: "Updated", onError: () => void onRestore?.() });
  const set = (state: "DONE" | "SKIPPED") => {
    onHide?.();
    mutation.mutate({ teamId, milestoneId, state });
  };
  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
            disabled={mutation.isPending}
            onClick={() => set("SKIPPED")}
            aria-label="Skip"
          >
            <SkipForward />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Skip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-8 rounded-full border-rule bg-transparent hover:border-done hover:bg-done hover:text-background"
            disabled={mutation.isPending}
            onClick={() => set("DONE")}
            aria-label="Done"
          >
            <Check />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Done</TooltipContent>
      </Tooltip>
    </div>
  );
}
