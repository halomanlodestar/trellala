"use client";

import type { MilestoneView } from "@trellala/core/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNow } from "@/hooks/use-now";
import { formatIst } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { milestones: MilestoneView[] };

/** A ruler: ticks for each milestone, ink up to "now", the next stop marked in red. */
export function TimelineStrip({ milestones }: Props) {
  const now = useNow();
  if (milestones.length === 0) return null;

  const sorted = [...milestones].sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const first = Math.min(...sorted.map((m) => (m.startsAt ?? m.endsAt).getTime()));
  const last = Math.max(...sorted.map((m) => m.endsAt.getTime()));
  const range = Math.max(last - first, 1);
  // Even spacing reads better than true scale when deadlines cluster; blend the two.
  const pos = (m: MilestoneView, i: number) => {
    const real = ((m.endsAt.getTime() - first) / range) * 100;
    const even = sorted.length === 1 ? 50 : (i / (sorted.length - 1)) * 100;
    return Math.min(100, Math.max(0, real * 0.5 + even * 0.5));
  };
  const nextIdx = sorted.findIndex((m) => m.endsAt >= now);
  const fill = nextIdx === -1 ? 100 : nextIdx === 0 ? 0 : (pos(sorted[nextIdx - 1]!, nextIdx - 1) + pos(sorted[nextIdx]!, nextIdx)) / 2;
  const stagger = sorted.length > 5;

  return (
    <div className={cn("px-3 pt-1 sm:px-10", stagger ? "pb-16" : "pb-10")} suppressHydrationWarning>
      <div className="relative h-px bg-border">
        <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${fill}%` }} />
        {sorted.map((m, i) => {
          const past = m.endsAt < now;
          const next = i === nextIdx;
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <div className="absolute top-0 -translate-x-1/2" style={{ left: `${pos(m, i)}%` }}>
                  <span className={cn("absolute -top-1.5 left-0 block h-3 w-px", past ? "bg-foreground" : next ? "bg-destructive" : "bg-muted-foreground/50")} />
                  {next && <span className="absolute -top-1.25 -left-1.25 block size-2.75 rounded-full border-2 border-destructive bg-background" />}
                  <span
                    className={cn(
                      "absolute top-3 left-0 flex w-28 -translate-x-1/2 flex-col items-center text-center leading-tight",
                      stagger && i % 2 === 1 && "top-9",
                    )}
                  >
                    <span className={cn("text-[11px]", next ? "font-medium text-destructive" : past ? "text-muted-foreground line-through decoration-1" : "text-foreground")}>
                      {m.title}
                    </span>
                    <span className="figures text-[10px] text-muted-foreground">{formatIst(m.endsAt, "d MMM")}</span>
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {m.title} · {formatIst(m.endsAt)} IST
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
