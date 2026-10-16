"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { filterTrigger, filterTriggerActive } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Props = { tags: string[] };

const ALL = "__all";

export function TagFilter({ tags }: Props) {
  const filters = useUrlFilters();
  const value = filters.get("tag");
  return (
    <Select value={value ?? ALL} onValueChange={(v) => filters.set("tag", v === ALL ? null : v)}>
      <SelectTrigger size="sm" className={cn(filterTrigger, value && filterTriggerActive)}>
        <SelectValue placeholder="Tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Any tag</SelectItem>
        {tags.map((t) => (
          <SelectItem key={t} value={t}>
            #{t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
