"use client";

import type { ActivityPage } from "@trellala/core/types";
import { Activity } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { displayValue, fieldLabel } from "@/lib/format";
import { formatIst } from "@/lib/time";

type Props = {
  filters: Record<string, string | undefined>;
  firstPage: ActivityPage;
  showHackathon?: boolean;
};

const ACTOR_MARK = { USER: "", API_KEY: "api", SYSTEM: "sys" } as const;

function summarize(before: unknown, after: unknown): string[] {
  const b = (before && typeof before === "object" ? before : {}) as Record<string, unknown>;
  const a = (after && typeof after === "object" ? after : {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].slice(0, 6);
  return keys.map((k) =>
    k in b && k in a ? `${fieldLabel(k)}: ${displayValue(b[k])} → ${displayValue(a[k])}` : `${fieldLabel(k)}: ${displayValue(a[k] ?? b[k])}`,
  );
}

/** A log book: timestamp column, then who did what. */
export function ActivityFeed({ filters, firstPage, showHackathon = true }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivityFeed(filters, firstPage);
  const items = data.pages.flatMap((p) => p.items);
  if (items.length === 0) return <EmptyState icon={Activity} text="No activity" />;

  return (
    <div className="flex flex-col gap-6">
      <ol className="border-t border-rule">
        {items.map((i) => {
          const lines = summarize(i.before, i.after);
          return (
            <li key={i.id} className="grid grid-cols-[5rem_1fr] gap-x-4 border-b py-3 text-sm sm:grid-cols-[7rem_1fr]">
              <span className="figures flex flex-col text-xs leading-tight text-muted-foreground">
                <span className="text-foreground">{formatIst(i.createdAt, "d MMM")}</span>
                {formatIst(i.createdAt, "HH:mm")}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{i.actorName}</span>
                  {ACTOR_MARK[i.actorType] && <span className="caps text-[10px] text-muted-foreground">{ACTOR_MARK[i.actorType]}</span>}
                  <span className="font-mono text-xs">{i.action}</span>
                  {showHackathon && i.hackathonId && (
                    <Link href={`/hackathons/${i.hackathonId}`} className="truncate text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      {i.hackathonName}
                    </Link>
                  )}
                </div>
                {lines.map((l) => (
                  <span key={l} className="truncate font-mono text-[11px] text-muted-foreground">
                    {l}
                  </span>
                ))}
                {i.note && <span className="font-serif text-base text-muted-foreground italic">“{i.note}”</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {hasNextPage && (
        <Button variant="outline" size="sm" className="self-center" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
          Older entries
        </Button>
      )}
    </div>
  );
}
