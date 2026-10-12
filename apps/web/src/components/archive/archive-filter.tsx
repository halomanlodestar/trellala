/** @format */

"use client";

import { ARCHIVE_REASON_LABEL } from "@trellala/core/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";

const ALL = "__all";

export function ArchiveFilter() {
  const filters = useUrlFilters();

  return (
    <Select
      value={filters.get("reason") ?? ALL}
      onValueChange={(v) => filters.set("reason", v === ALL ? null : v)}
    >
      <SelectTrigger size="sm" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All reasons</SelectItem>
        {Object.entries(ARCHIVE_REASON_LABEL).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
