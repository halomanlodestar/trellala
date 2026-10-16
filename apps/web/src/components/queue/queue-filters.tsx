"use client";

import { TagFilter } from "@/components/hackathons/tag-filter";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { cn } from "@/lib/utils";

type Props = { tags: string[] };

export function QueueFilters({ tags }: Props) {
  const filters = useUrlFilters();
  const mine = filters.get("mine") === "true";
  return (
    <div className="flex items-center gap-1">
      <div className="caps flex items-center rounded-sm border p-0.5">
        {[
          { on: false, label: "Everyone" },
          { on: true, label: "Mine" },
        ].map(({ on, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={mine === on}
            onClick={() => filters.set("mine", on ? "true" : null)}
            className={cn("rounded-xs px-2.5 py-1 text-muted-foreground transition-colors hover:text-foreground", mine === on && "bg-foreground text-background hover:text-background")}
          >
            {label}
          </button>
        ))}
      </div>
      <TagFilter tags={tags} />
    </div>
  );
}
