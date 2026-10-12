"use client";

import { HACKATHON_STAGE_LABEL } from "@trellala/core/constants";
import type { HackathonStage } from "@trellala/core/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSetStage } from "@/hooks/use-set-stage";

type Props = { hackathonId: string; stage: HackathonStage };

export function StageSelect({ hackathonId, stage }: Props) {
  const mutation = useSetStage();
  return (
    <Select value={stage} disabled={mutation.isPending} onValueChange={(v) => mutation.mutate({ hackathonId, stage: v })}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(HACKATHON_STAGE_LABEL).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
