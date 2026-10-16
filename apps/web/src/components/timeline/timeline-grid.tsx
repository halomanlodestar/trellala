"use client";

import { Fragment } from "react";
import { useNow } from "@/hooks/use-now";
import { formatIst } from "@/lib/time";
import { position } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineWindow } from "@/types";

type Props = { window: TimelineWindow; weekends: boolean; dense: boolean };

/** Day rules, weekend shading and the "now" line, drawn once behind every row's track. */
export function TimelineGrid({ window: w, weekends, dense }: Props) {
  const now = useNow();
  const width = `${100 / w.days.length}%`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-(--lab)">
      {w.days.map((d) => {
        const wd = formatIst(d, "EEE");
        const left = `${position(w, d)}%`;
        return (
          <Fragment key={d.getTime()}>
            {weekends && (wd === "Sat" || wd === "Sun") && <span className="absolute inset-y-0 bg-muted/70" style={{ left, width }} />}
            {(!dense || wd === "Mon") && <span className={cn("absolute inset-y-0 w-px bg-border", wd !== "Mon" && "opacity-45")} style={{ left }} />}
          </Fragment>
        );
      })}
      <span className="absolute inset-y-0 z-5 border-l-[1.5px] border-destructive" style={{ left: `${position(w, now)}%` }} suppressHydrationWarning />
    </div>
  );
}
