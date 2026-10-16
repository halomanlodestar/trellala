"use client";

import { useNow } from "@/hooks/use-now";
import { timelineLabel, timelineRow } from "@/lib/styles";
import { formatIst } from "@/lib/time";
import { position } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineWindow, TimelineZoom } from "@/types";

type Props = { window: TimelineWindow; zoom: TimelineZoom };

/** Day labels at 2 weeks; Monday labels otherwise. The 1st of a month is set in ink. */
export function TimelineAxis({ window: w, zoom }: Props) {
  const now = useNow();
  const daily = zoom === "2w";
  return (
    <div className={cn(timelineRow, "border-rule")}>
      <div className={cn(timelineLabel, "caps border-r-transparent text-muted-foreground")}>{daily ? "Day" : "Week of"}</div>
      <div className="relative h-8.5">
        {w.days.map((d) => {
          const first = formatIst(d, "d") === "1";
          if (!daily && formatIst(d, "EEE") !== "Mon") return null;
          return (
            <span
              key={d.getTime()}
              className={cn(
                "absolute bottom-1.75 translate-x-1 font-mono text-[10.5px] tracking-wider whitespace-nowrap text-muted-foreground uppercase",
                first && "font-medium text-foreground",
              )}
              style={{ left: `${position(w, d)}%` }}
            >
              {daily && !first ? formatIst(d, "EEE d") : formatIst(d, "d MMM")}
            </span>
          );
        })}
        <span
          className="absolute top-0.5 -translate-x-1/2 font-mono text-[10.5px] font-medium tracking-wider text-destructive uppercase"
          style={{ left: `${position(w, now)}%` }}
          suppressHydrationWarning
        >
          Now
        </span>
      </div>
    </div>
  );
}
