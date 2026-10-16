"use client";

import { ARCHIVE_REASON_LABEL } from "@trellala/core/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { filterTrigger, filterTriggerActive } from "@/lib/styles";
import { cn } from "@/lib/utils";

const ALL = "__all";

export function ArchiveFilter() {
  const filters = useUrlFilters();
  const value = filters.get("reason");
  return (
    <Select value={value ?? ALL} onValueChange={(v) => filters.set("reason", v === ALL ? null : v)}>
      <SelectTrigger size="sm" className={cn(filterTrigger, value && filterTriggerActive)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value={ALL}>Any reason</SelectItem>
        {Object.entries(ARCHIVE_REASON_LABEL).map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
