import { MILESTONE_KIND_LABEL } from "@trellala/core/constants";
import type { MilestoneView } from "@trellala/core/types";
import { Lock } from "lucide-react";
import { Deadline, IstTime } from "@/components/common/deadline";
import { cn } from "@/lib/utils";

type Props = { milestones: MilestoneView[]; now: Date };

/** Vertical event timeline: past greyed out, next upcoming highlighted. */
export function MilestoneTimeline({ milestones, now }: Props) {
  if (milestones.length === 0) return <p className="text-sm text-muted-foreground">No milestones</p>;
  const nextId = milestones.find((m) => m.endsAt >= now)?.id;
  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {milestones.map((m) => {
        const past = m.endsAt < now;
        const next = m.id === nextId;
        return (
          <li key={m.id} className={cn("relative", past && "opacity-50")}>
            <span
              className={cn(
                "absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-muted-foreground",
                next && "size-3 -left-[26px] bg-primary ring-4 ring-primary/20",
              )}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={cn("font-medium", next && "text-primary")}>{m.title}</span>
              <span className="text-xs text-muted-foreground">{MILESTONE_KIND_LABEL[m.kind]}</span>
              {m.isHardDeadline && m.requiresAction && <Lock className="size-3 text-muted-foreground" aria-label="Hard deadline" />}
              {!past && <Deadline at={m.endsAt} className="text-xs" />}
            </div>
            <div className="text-xs text-muted-foreground">
              {m.startsAt && (
                <>
                  <IstTime at={m.startsAt} short /> →{" "}
                </>
              )}
              <IstTime at={m.endsAt} /> IST
            </div>
            {m.action && <p className="mt-1 text-sm">{m.action}</p>}
          </li>
        );
      })}
    </ol>
  );
}
