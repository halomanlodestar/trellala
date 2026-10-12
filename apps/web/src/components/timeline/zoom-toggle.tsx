"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUrlFilters } from "@/hooks/use-url-filters";

export function ZoomToggle() {
  const filters = useUrlFilters();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={filters.get("zoom") ?? "month"}
      onValueChange={(v) => v && filters.set("zoom", v === "month" ? null : v)}
    >
      <ToggleGroupItem value="week">2 weeks</ToggleGroupItem>
      <ToggleGroupItem value="month">2 months</ToggleGroupItem>
      <ToggleGroupItem value="quarter">4 months</ToggleGroupItem>
    </ToggleGroup>
  );
}
