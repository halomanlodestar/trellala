"use client";

import { TextToggle } from "@/components/common/text-toggle";
import { useUrlFilters } from "@/hooks/use-url-filters";

const VIEWS = { gantt: "Gantt", calendar: "Calendar" };

export function ViewToggle() {
  const filters = useUrlFilters();
  return <TextToggle options={VIEWS} value={filters.get("view") ?? "gantt"} onChange={(v) => filters.set("view", v === "gantt" ? null : v)} />;
}
