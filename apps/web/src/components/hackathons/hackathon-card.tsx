import type { HackathonSummary } from "@trellala/core/types";
import Link from "next/link";
import { KindLine, Tags } from "@/components/common/badges";
import { Deadline } from "@/components/common/deadline";
import { MemberAvatars } from "@/components/common/member-avatars";
import { SpanProgress } from "@/components/common/span-progress";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { hackathon: HackathonSummary; compact?: boolean; className?: string };

/** A paper slip: kind + prize, serif name, next deadline, progress through the event. */
export function HackathonCard({ hackathon: h, compact, className }: Props) {
  return (
    <Link
      href={`/hackathons/${h.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-sm border bg-card p-4 transition-colors hover:border-rule",
        h.hasMissedTeam && "border-l-2 border-l-destructive",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <KindLine type={h.type} mode={h.mode} />
        {h.estimatedUsd !== null && <span className="figures text-sm">{formatUsd(h.estimatedUsd)}</span>}
      </div>

      <h3 className={cn("font-serif leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4", compact ? "text-xl" : "text-2xl")}>
        {h.name}
      </h3>

      <div className="flex items-end justify-between gap-3 border-t border-dashed pt-3">
        <div className="flex min-w-0 flex-col">
          <span className="caps text-muted-foreground">{h.hasMissedTeam ? <span className="text-destructive">Missed · next</span> : "Next"}</span>
          <span className="truncate text-sm">{h.nextAction?.title ?? "Nothing upcoming"}</span>
        </div>
        {h.nextAction && <Deadline at={h.nextAction.endsAt} />}
      </div>

      <SpanProgress span={h.span} className="my-1" />

      <div className="flex items-center justify-between gap-2">
        {compact ? <span /> : <Tags tags={h.tags.slice(0, 3)} />}
        <div className="flex items-center gap-2">
          <MemberAvatars people={h.members} max={3} />
          <span className="caps text-muted-foreground">
            {h.teamCount} {h.teamCount === 1 ? "team" : "teams"}
          </span>
        </div>
      </div>
    </Link>
  );
}
