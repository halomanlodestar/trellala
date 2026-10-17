"use client";

import type { QueueItem } from "@trellala/core/types";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { KindLine } from "@/components/common/badges";
import { Deadline } from "@/components/common/deadline";
import { MemberAvatars } from "@/components/common/member-avatars";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types";
import { QueueItemActions } from "./queue-item-actions";

type Props = { item: QueueItem; tone: Tone; onHide: () => void; onRestore: () => void };

/** One timetable row: countdown | what + where | who | tick. */
export function QueueItemCard({ item, tone, onHide, onRestore }: Props) {
  return (
    <div className="group grid grid-cols-[4.5rem_1fr_auto] items-start gap-x-4 gap-y-2 py-3.5 sm:grid-cols-[6rem_1fr_auto_auto] sm:items-center">
      <Deadline at={item.endsAt} showDate className={cn("items-start pt-0.5 sm:pt-0", tone === "faint" && "opacity-70")} />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{item.title}</span>
          {item.isHardDeadline && <span className="caps text-[10px] text-destructive">Hard</span>}
          {item.teamOnly && <span className="caps text-[10px] text-muted-foreground">Team</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <Link href={`/hackathons/${item.hackathonId}`} className="text-foreground/80 underline-offset-4 hover:text-foreground hover:underline">
            {item.hackathonName}
          </Link>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              title="Source"
              aria-label="Open source"
              className="-ml-1 text-foreground/60 hover:text-destructive"
            >
              <ArrowUpRight className="size-3.5" />
            </a>
          )}
          <span aria-hidden>›</span>
          {item.teamId ? (
            <Link href={`/hackathons/${item.hackathonId}/teams/${item.teamId}`} className="underline-offset-4 hover:text-foreground hover:underline">
              {item.teamName}
            </Link>
          ) : (
            <span className="italic">no team yet</span>
          )}
          <KindLine type={item.hackathonType} mode={item.mode} className="ml-2 hidden md:inline-flex" />
        </div>
        {item.action && <p className="line-clamp-1 text-sm text-muted-foreground">{item.action}</p>}
      </div>

      <div className="hidden sm:block">
        <MemberAvatars people={item.members} max={3} />
      </div>

      <div className="flex justify-end">
        {item.teamId ? (
          <QueueItemActions teamId={item.teamId} milestoneId={item.milestoneId} onHide={onHide} onRestore={onRestore} />
        ) : (
          <Link href={`/hackathons/${item.hackathonId}?tab=teams`} className="caps whitespace-nowrap underline underline-offset-4 hover:text-destructive">
            Add team
          </Link>
        )}
      </div>
    </div>
  );
}
