"use client";

import { TEAM_STATUS_LABEL } from "@trellala/core/constants";
import type { TimelineTeam } from "@trellala/core/types";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { timelineLabel, timelineRow } from "@/lib/styles";
import { formatIst } from "@/lib/time";
import { inWindow, position, TEAM_MARK_GLYPH, TEAM_MARK_LABEL, TEAM_MARK_TONE } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineWindow } from "@/types";

type Props = { team: TimelineTeam; hackathonId: string; window: TimelineWindow };

/** One team's standing against each action, under its hackathon's lane. */
export function TeamRow({ team, hackathonId, window: w }: Props) {
  return (
    <div className={timelineRow}>
      <div className={cn(timelineLabel, "py-1.5")}>
        <span className="w-4.5 shrink-0" />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <Link href={`/hackathons/${hackathonId}/teams/${team.id}`} className="truncate text-sm underline-offset-4 hover:underline">
            {team.name}
          </Link>
          <span className={cn("caps text-[9.5px] whitespace-nowrap text-muted-foreground", team.missed && "text-destructive")}>
            {team.missed ? "Missed" : TEAM_STATUS_LABEL[team.status]}
          </span>
        </div>
        <span className="caps text-[10px] text-muted-foreground">
          {team.done}/{team.total}
        </span>
      </div>
      <div className="relative h-8.5 min-w-0 before:absolute before:inset-x-0 before:top-1/2 before:border-t before:border-dashed">
        {team.marks
          .filter((m) => inWindow(w, m.at))
          .map((m) => (
            <Tooltip key={m.milestoneId}>
              <TooltipTrigger asChild>
                {m.teamOnly ? (
                  <button type="button" className="absolute top-1/2 -ml-1 flex -translate-y-1/2 items-center gap-1.5" style={{ left: `${position(w, m.at)}%` }}>
                    <i className={cn("size-2 border-[1.5px] border-foreground bg-background", m.state === "done" && "border-done bg-done")} />
                    <em className="bg-background pr-1 text-[11px] whitespace-nowrap text-muted-foreground not-italic">{m.title}</em>
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`${m.title}: ${TEAM_MARK_LABEL[m.state]}`}
                    className={cn("absolute top-1/2 -translate-1/2 bg-background px-0.75 py-0.5 font-mono text-sm leading-none font-medium", TEAM_MARK_TONE[m.state])}
                    style={{ left: `${position(w, m.at)}%` }}
                  >
                    {TEAM_MARK_GLYPH[m.state]}
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-0.5">
                  <span className="caps text-muted-foreground">
                    {team.name}
                    {m.teamOnly && " · team milestone"}
                  </span>
                  <span className="font-serif text-lg leading-tight">{m.title}</span>
                  <span className="figures">{formatIst(m.at, "EEE d MMM, HH:mm")} IST</span>
                  <span className={TEAM_MARK_TONE[m.state]}>{TEAM_MARK_LABEL[m.state]}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
      </div>
    </div>
  );
}
