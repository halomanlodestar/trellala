/** @format */

"use client";

import type { ActivityPage } from "@trellala/core/types";
import { Activity, Bot, Cpu, User } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { fieldLabel, displayValue } from "@/lib/format";
import { formatIstShort } from "@/lib/time";

type Props = {
  filters: Record<string, string | undefined>;
  firstPage: ActivityPage;
  showHackathon?: boolean;
};

const ACTOR_ICON = { USER: User, API_KEY: Bot, SYSTEM: Cpu } as const;

function summarize(before: unknown, after: unknown): string[] {
  const b = (before && typeof before === "object" ? before : {}) as Record<
    string,
    unknown
  >;
  const a = (after && typeof after === "object" ? after : {}) as Record<
    string,
    unknown
  >;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].slice(0, 6);

  return keys.map((k) =>
    k in b && k in a
      ? `${fieldLabel(k)}: ${displayValue(b[k])} → ${displayValue(a[k])}`
      : `${fieldLabel(k)}: ${displayValue(a[k] ?? b[k])}`,
  );
}

export function ActivityFeed({
  filters,
  firstPage,
  showHackathon = true,
}: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityFeed(filters, firstPage);
  const items = data.pages.flatMap((p) => p.items);
  if (items.length === 0)
    return <EmptyState icon={Activity} text="No activity" />;

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y rounded-lg border">
        {items.map((i) => {
          const Icon = ACTOR_ICON[i.actorType];
          const lines = summarize(i.before, i.after);
          return (
            <li key={i.id} className="flex gap-3 p-3 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">{i.actorName}</span>
                  <code className="rounded bg-muted px-1 text-xs">
                    {i.action}
                  </code>
                  {showHackathon && i.hackathonId && (
                    <Link
                      href={`/hackathons/${i.hackathonId}`}
                      className="truncate text-muted-foreground hover:underline"
                    >
                      {i.hackathonName}
                    </Link>
                  )}
                  <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatIstShort(i.createdAt)}
                  </span>
                </div>
                {lines.map((l) => (
                  <span
                    key={l}
                    className="truncate text-xs text-muted-foreground"
                  >
                    {l}
                  </span>
                ))}
                {i.note && (
                  <span className="text-xs italic text-muted-foreground">
                    {i.note}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          More
        </Button>
      )}
    </div>
  );
}
