import type { TimelineRow } from "@trellala/core/types";
import Link from "next/link";
import { TypeBadge } from "@/components/common/badges";
import { formatIst } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { GanttRange } from "@/types";
import { GanttMarkers, ganttPct } from "./gantt-markers";

type Props = { rows: TimelineRow[]; range: GanttRange; now: Date };

const DAY = 864e5;

/** CSS-grid Gantt: one row per hackathon (and per team), milestone markers, a today line. */
export function Gantt({ rows, range, now }: Props) {
  const weeks = Array.from({ length: Math.ceil(range.days / 7) }, (_, i) => new Date(range.start.getTime() + i * 7 * DAY));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[220px_1fr] border-b bg-muted/40 text-xs text-muted-foreground">
          <div className="px-3 py-2" />
          <div className="relative h-8">
            {weeks.map((w) => (
              <span key={w.getTime()} className="absolute top-2 -translate-x-1/2" style={{ left: `${ganttPct(w, range)}%` }}>
                {formatIst(w, "d MMM")}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 left-[220px]">
            <div className="absolute inset-y-0 w-px bg-destructive/60" style={{ left: `${ganttPct(now, range)}%` }} />
          </div>
          {rows.map((r) => (
            <div key={r.hackathonId} className="border-b last:border-b-0">
              <div className="grid grid-cols-[220px_1fr] items-center">
                <Link href={`/hackathons/${r.hackathonId}`} className="flex items-center gap-2 truncate px-3 py-1.5 text-sm font-medium hover:underline">
                  <TypeBadge type={r.type} />
                  <span className="truncate">{r.name}</span>
                </Link>
                <GanttMarkers milestones={r.milestones} range={range} now={now} />
              </div>
              {r.teams.map((t) => (
                <div key={t.id} className="grid grid-cols-[220px_1fr] items-center text-muted-foreground">
                  <span className={cn("truncate py-1 pr-3 pl-8 text-xs", t.status === "MISSED" && "text-destructive")}>{t.name}</span>
                  <GanttMarkers
                    milestones={[...r.milestones.filter((m) => m.requiresAction), ...t.milestones].sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime())}
                    range={range}
                    now={now}
                    done={new Set(t.progress.filter((p) => p.state === "DONE").map((p) => p.milestoneId))}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
