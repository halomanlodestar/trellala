"use client";

import { Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSetProgress } from "@/hooks/use-set-progress";

type Props = { teamId: string; milestoneId: string };

export function QueueItemActions({ teamId, milestoneId }: Props) {
  const mutation = useSetProgress({ success: "Updated" });
  const set = (state: "DONE" | "SKIPPED") => mutation.mutate({ teamId, milestoneId, state });
  return (
    <div className="flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" className="size-8" disabled={mutation.isPending} onClick={() => set("DONE")}>
            <Check />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Done</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" className="size-8" disabled={mutation.isPending} onClick={() => set("SKIPPED")}>
            <SkipForward />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Skip</TooltipContent>
      </Tooltip>
    </div>
  );
}
