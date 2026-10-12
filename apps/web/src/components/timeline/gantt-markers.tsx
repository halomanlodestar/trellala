import type { MilestoneView } from "@trellala/core/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatIst } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { GanttRange } from "@/types";

type Props = { milestones: MilestoneView[]; range: GanttRange; now: Date; done?: Set<string> };

export const ganttPct = (d: Date, range: GanttRange) =>
  Math.min(100, Math.max(0, ((d.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())) * 100));

export function GanttMarkers({ milestones, range, now, done }: Props) {
  const spanStart = milestones[0]?.startsAt ?? milestones[0]?.endsAt;
  const spanEnd = milestones.at(-1)?.endsAt;
  const pct = (d: Date) => ganttPct(d, range);
  return (
    <div className="relative h-7">
      {spanStart && spanEnd && (
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded bg-muted"
          style={{ left: `${pct(spanStart)}%`, width: `${Math.max(pct(spanEnd) - pct(spanStart), 0.5)}%` }}
        />
      )}
      {milestones.map((m) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-background",
                m.endsAt < now ? "bg-muted-foreground/50" : m.isHardDeadline && m.requiresAction ? "bg-primary" : "bg-blue-400",
                done?.has(m.id) && "bg-emerald-500",
              )}
              style={{ left: `${pct(m.endsAt)}%` }}
            />
          </TooltipTrigger>
          <TooltipContent>
            {m.title} · {formatIst(m.endsAt)} IST
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
