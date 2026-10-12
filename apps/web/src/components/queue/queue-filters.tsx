"use client";

import { Tag, User } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { TagFilter } from "@/components/hackathons/tag-filter";

type Props = { tags: string[] };

export function QueueFilters({ tags }: Props) {
  const filters = useUrlFilters();
  return (
    <div className="flex items-center gap-2">
      <Toggle
        variant="outline"
        size="sm"
        pressed={filters.get("mine") === "true"}
        onPressedChange={(on) => filters.set("mine", on ? "true" : null)}
      >
        <User /> Mine
      </Toggle>
      <TagFilter tags={tags} icon={Tag} />
    </div>
  );
}
