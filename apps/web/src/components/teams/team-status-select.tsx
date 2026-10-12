"use client";

import { TEAM_STATUS_LABEL, TEAM_STATUSES } from "@trellala/core/constants";
import type { PrizeView, TeamView } from "@trellala/core/types";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSetTeamStatus } from "@/hooks/use-set-team-status";

type Props = { team: TeamView; prizes: PrizeView[] };

const SETTABLE = TEAM_STATUSES.filter((s) => s !== "MISSED" && s !== "WON");

export function TeamStatusSelect({ team, prizes }: Props) {
  const mutation = useSetTeamStatus({ success: "Status updated" });
  const set = (status: string, wonPrizeId: string | null = null) => mutation.mutate({ teamId: team.id, status, wonPrizeId });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="size-8" aria-label="Set status" disabled={mutation.isPending}>
          <Flag />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SETTABLE.map((s) => (
          <DropdownMenuItem key={s} disabled={s === team.status} onSelect={() => set(s)}>
            {TEAM_STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
        {prizes.length > 0 ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Won</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {prizes.map((p) => (
                <DropdownMenuItem key={p.id} onSelect={() => set("WON", p.id)}>
                  {p.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem onSelect={() => set("WON")}>Won</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
