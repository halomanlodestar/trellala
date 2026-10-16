import type { HackathonSummary } from "@trellala/core/types";
import Link from "next/link";
import { KindLine, StageBadge, Tags } from "@/components/common/badges";
import { Deadline } from "@/components/common/deadline";
import { MemberAvatars } from "@/components/common/member-avatars";
import { formatUsd } from "@/lib/format";

type Props = { hackathons: HackathonSummary[] };

const COLS = "grid grid-cols-[4.5rem_1fr_auto] gap-x-4 sm:grid-cols-[6rem_minmax(0,1.6fr)_minmax(0,1fr)_5.5rem] lg:grid-cols-[6rem_minmax(0,1.6fr)_minmax(0,1fr)_5.5rem_6.5rem]";

/** The ledger: one row per hackathon, read left to right like a timetable. */
export function HackathonTable({ hackathons }: Props) {
  return (
    <div>
      <div className={`${COLS} caps border-b border-rule pb-2 text-muted-foreground`}>
        <span>Due</span>
        <span>Hackathon</span>
        <span className="hidden sm:block">Next</span>
        <span className="text-right">Prize</span>
        <span className="hidden text-right lg:block">Teams</span>
      </div>
      <ol>
        {hackathons.map((h) => (
          <li key={h.id} className={`${COLS} group relative items-start border-b py-3.5 hover:bg-accent/50`}>
            <div className="pt-0.5">
              {h.nextAction ? <Deadline at={h.nextAction.endsAt} showDate className="items-start" /> : <span className="figures text-sm text-muted-foreground">—</span>}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Link href={`/hackathons/${h.id}`} className="font-medium after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                {h.hasMissedTeam && <span className="caps mr-2 text-[10px] text-destructive">Missed</span>}
                {h.name}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <KindLine type={h.type} mode={h.mode} />
                <StageBadge stage={h.stage} />
                <Tags tags={h.tags.slice(0, 3)} />
              </div>
              {h.nextAction && <span className="truncate text-sm text-muted-foreground sm:hidden">{h.nextAction.title}</span>}
            </div>
            <span className="hidden truncate pt-0.5 text-sm sm:block">{h.nextAction?.title ?? <span className="text-muted-foreground">Nothing upcoming</span>}</span>
            <div className="flex flex-col items-end pt-0.5">
              <span className="figures text-sm">{formatUsd(h.estimatedUsd) ?? "—"}</span>
              {h.prizeSummary && <span className="hidden max-w-full truncate text-[11px] text-muted-foreground sm:block">{h.prizeSummary}</span>}
            </div>
            <div className="hidden items-center justify-end gap-2 pt-0.5 lg:flex">
              <MemberAvatars people={h.members} max={3} />
              <span className="figures w-4 text-right text-sm text-muted-foreground">{h.teamCount}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
