import type { TimelineLane } from "@trellala/core/types";
import { timelineLabel, timelineRow } from "@/lib/styles";
import { hardDeadlinesPerDay, position } from "@/lib/timeline";
import { cn } from "@/lib/utils";
import type { TimelineWindow } from "@/types";

type Props = { lanes: TimelineLane[]; window: TimelineWindow };

/** Hard deadlines per day; two or more on one day turns red. */
export function LoadRow({ lanes, window: w }: Props) {
  const counts = hardDeadlinesPerDay(lanes, w);
  const width = `${100 / w.days.length}%`;
  return (
    <div className={timelineRow}>
      <div className={cn(timelineLabel, "caps text-muted-foreground")}>Hard deadlines / day</div>
      <div className="relative h-11.5">
        {counts.map((c, i) => {
          const day = w.days[i];
          if (!c || !day) return null;
          return (
            <span key={day.getTime()} className="absolute bottom-0 flex flex-col items-center justify-end" style={{ left: `${position(w, day)}%`, width }}>
              <b className={cn("figures mb-0.5 text-[10px] font-medium text-muted-foreground", c >= 2 && "text-destructive")}>{c}</b>
              <i className={cn("block w-[62%] min-w-0.75 bg-foreground", c >= 2 && "bg-destructive")} style={{ height: Math.min(c, 4) * 7 }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}
