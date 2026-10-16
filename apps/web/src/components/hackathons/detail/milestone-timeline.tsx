import { MILESTONE_KIND_LABEL } from "@trellala/core/constants";
import type { MilestoneView } from "@trellala/core/types";
import { Deadline } from "@/components/common/deadline";
import { formatIst } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { milestones: MilestoneView[]; now: Date };

/** The schedule: date column, milestone, countdown. Past rows fade, the next one is marked. */
export function MilestoneTimeline({ milestones, now }: Props) {
  if (milestones.length === 0) return <p className="text-sm text-muted-foreground">No milestones</p>;
  const nextId = milestones.find((m) => m.endsAt >= now)?.id;
  return (
    <ol className="border-t border-rule">
      {milestones.map((m) => {
        const past = m.endsAt < now;
        const next = m.id === nextId;
        return (
          <li key={m.id} className={cn("relative grid grid-cols-[4.5rem_1fr_auto] gap-x-4 border-b py-3", past && "text-muted-foreground")}>
            {next && <span className="absolute inset-y-0 -left-3 w-0.5 bg-destructive" aria-hidden />}
            <div className="figures flex flex-col leading-tight">
              <span className={cn("text-sm", next && "text-destructive")}>{formatIst(m.endsAt, "d MMM")}</span>
              <span className="text-[11px] text-muted-foreground">{formatIst(m.endsAt, "EEE HH:mm")}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn("font-medium", past && "font-normal line-through decoration-1")}>{m.title}</span>
                <span className="caps text-[10px] text-muted-foreground">{MILESTONE_KIND_LABEL[m.kind]}</span>
                {m.isHardDeadline && m.requiresAction && <span className="caps text-[10px] text-destructive">Hard</span>}
              </div>
              {m.startsAt && (
                <span className="figures text-[11px] text-muted-foreground">
                  from {formatIst(m.startsAt, "d MMM, HH:mm")}
                </span>
              )}
              {m.action && <p className="text-sm text-muted-foreground">{m.action}</p>}
            </div>
            <div className="pt-0.5">{!past && <Deadline at={m.endsAt} />}</div>
          </li>
        );
      })}
    </ol>
  );
}
