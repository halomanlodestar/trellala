"use client";

import { TextToggle } from "@/components/common/text-toggle";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { TIMELINE_ZOOMS } from "@/lib/timeline";
import type { TimelineParams } from "@/types";

type Props = TimelineParams;

const ZOOMS = Object.fromEntries(Object.entries(TIMELINE_ZOOMS).map(([k, v]) => [k, v.label]));
const VIEWS = { lanes: "Lanes", calendar: "Calendar" };

export function TimelineControls({ view, zoom }: Props) {
  const filters = useUrlFilters();
  return (
    <div className="flex items-center gap-4">
      {view === "lanes" && (
        <>
          <TextToggle options={ZOOMS} value={zoom} onChange={(v) => filters.set("zoom", v === "6w" ? null : v)} />
          <span className="h-4 w-px bg-border" aria-hidden />
        </>
      )}
      <TextToggle options={VIEWS} value={view} onChange={(v) => filters.set("view", v === "lanes" ? null : v)} />
    </div>
  );
}
