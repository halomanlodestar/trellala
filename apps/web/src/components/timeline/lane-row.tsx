"use client";

import { HACKATHON_MODE_LABEL, HACKATHON_TYPE_LABEL } from "@trellala/core/constants";
import type { TimelineLane, TimelineMarkKind } from "@trellala/core/types";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { Deadline } from "@/components/common/deadline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatUsd } from "@/lib/format";
import { timelineLabel, timelineRow } from "@/lib/styles";
import { formatIst } from "@/lib/time";
import { clipSpan, inWindow, position, TEAM_MARK_GLYPH, TEAM_MARK_LABEL, TEAM_MARK_TONE } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineLayers, TimelineWindow } from "@/types";

type Props = {
  lane: TimelineLane;
  window: TimelineWindow;
  layers: TimelineLayers;
  trackPx: number;
  now: Date;
  open: boolean;
  onToggle: () => void;
};

const DIAMOND: Record<TimelineMarkKind, string> = {
  hard: "bg-destructive",
  action: "bg-foreground",
  info: "bg-card shadow-[inset_0_0_0_1.5px_var(--foreground)]",
};

/** Labels closer than this (in px) would collide, so the later one is dropped. */
const LABEL_GAP_PX = 104;
/** Phases narrower than this (in px) don't get a caption. */
const PHASE_LABEL_PX = 64;

export function LaneRow({ lane, window: w, layers, trackPx, now, open, onToggle }: Props) {
  const nextId = lane.next?.milestoneId;
  const marks = lane.marks.filter((m) => inWindow(w, m.at) && (layers.info || m.kind !== "info"));
  const labelled = new Set<string>();
  let lastLabelPx = -Infinity;
  for (const m of marks) {
    const px = (position(w, m.at) / 100) * trackPx;
    if (m.milestoneId === nextId || (layers.labels && px - lastLabelPx >= LABEL_GAP_PX)) {
      labelled.add(m.milestoneId);
      lastLabelPx = px;
    }
  }
  const nowPct = position(w, now);
  const prize = formatUsd(lane.estimatedUsd);

  return (
    <div className={timelineRow}>
      <div className={timelineLabel}>
        {layers.teams && lane.teams.length > 0 ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} teams for ${lane.name}`}
            className="flex size-4.5 shrink-0 items-center justify-center rounded-xs border text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            {open ? <Minus className="size-3" /> : <Plus className="size-3" />}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/hackathons/${lane.hackathonId}`} className="block truncate font-serif text-lg leading-tight underline-offset-4 hover:underline">
            {lane.name}
          </Link>
          <div className="caps truncate text-[10px] text-muted-foreground">
            {HACKATHON_TYPE_LABEL[lane.type]} · {HACKATHON_MODE_LABEL[lane.mode]}
            {prize && ` · ${prize}`}
          </div>
        </div>
        {lane.next && <Deadline at={lane.next.endsAt} />}
      </div>

      <div className="relative h-20 min-w-0">
        {layers.phases &&
          lane.phases.map((p) => {
            const span = clipSpan(w, p.startsAt, p.endsAt);
            if (!span) return null;
            const fill = Math.min(100, Math.max(0, ((nowPct - span.left) / span.width) * 100));
            return (
              <div
                key={p.milestoneId}
                title={`${p.title} · ${formatIst(p.startsAt, "d MMM HH:mm")} → ${formatIst(p.endsAt, "d MMM HH:mm")} IST`}
                className={cn("absolute top-7.75 h-1.75 border border-foreground", p.endsAt < now && "opacity-35")}
                style={{ left: `${span.left}%`, width: `${span.width}%`, background: `linear-gradient(90deg, var(--foreground) ${fill}%, var(--card) ${fill}%)` }}
              >
                {(span.width / 100) * trackPx > PHASE_LABEL_PX && (
                  <span className="caps absolute bottom-2.5 -left-px text-[10px] whitespace-nowrap text-muted-foreground">{p.title}</span>
                )}
              </div>
            );
          })}

        {marks.map((m) => {
          const past = m.at < now;
          const next = m.milestoneId === nextId;
          return (
            <Tooltip key={m.milestoneId}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${m.title}, ${formatIst(m.at)} IST`}
                  className={cn("absolute top-5.75 -ml-2.75 grid h-6 w-5.5 place-items-center", past && "opacity-35")}
                  style={{ left: `${position(w, m.at)}%` }}
                >
                  <span className={cn("absolute inset-y-0 left-1/2 w-px opacity-50", m.kind === "hard" ? "bg-destructive" : "bg-foreground")} />
                  <span
                    className={cn("relative size-2.25 rotate-45", DIAMOND[m.kind], next && "shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--destructive)]")}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-0.5">
                  <span className="caps text-muted-foreground">
                    {lane.name} · {m.kind === "hard" ? "hard deadline" : m.kind === "action" ? "action" : "info"}
                  </span>
                  <span className="font-serif text-lg leading-tight">{m.title}</span>
                  <span className="figures">{formatIst(m.at, "EEE d MMM, HH:mm")} IST</span>
                  {lane.teams.map((t) => {
                    const tm = t.marks.find((x) => x.milestoneId === m.milestoneId);
                    return (
                      tm && (
                        <span key={t.id}>
                          <b className={TEAM_MARK_TONE[tm.state]}>{TEAM_MARK_GLYPH[tm.state]}</b> {t.name} · {TEAM_MARK_LABEL[tm.state]}
                        </span>
                      )
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {marks
          .filter((m) => labelled.has(m.milestoneId))
          .map((m) => {
            const x = position(w, m.at);
            const past = m.at < now;
            const next = m.milestoneId === nextId;
            return (
              <div
                key={m.milestoneId}
                className={cn(
                  "pointer-events-none absolute top-12.25 text-xs leading-tight whitespace-nowrap",
                  x > 86 ? "-translate-x-[calc(100%-6px)] text-right" : "-translate-x-1.5",
                  past && "text-muted-foreground line-through decoration-1",
                  next && "font-medium text-destructive",
                )}
                style={{ left: `${x}%` }}
              >
                {m.title}
                <span className="figures block text-[10px] font-normal text-muted-foreground no-underline">{formatIst(m.at, "EEE d, HH:mm")}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
