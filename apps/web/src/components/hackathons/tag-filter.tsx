/** @format */

"use client";

import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlFilters } from "@/hooks/use-url-filters";

type Props = { tags: string[]; icon?: LucideIcon };

const ALL = "__all";

export function TagFilter({ tags, icon: Icon }: Props) {
  const filters = useUrlFilters();
  return (
    <Select
      value={filters.get("tag") ?? ALL}
      onValueChange={(v) => filters.set("tag", v === ALL ? null : v)}
    >
      <SelectTrigger size="sm" className="w-36">
        {Icon && <Icon className="size-4" />}
        <SelectValue placeholder="Tag" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All tags</SelectItem>
        {tags.map((t) => (
          <SelectItem key={t} value={t}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
