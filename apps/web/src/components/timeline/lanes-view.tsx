"use client";

import type { TimelineLane } from "@trellala/core/types";
import { type CSSProperties, Fragment, useState } from "react";
import { useElementWidth } from "@/hooks/use-element-width";
import { useTimelineLayers } from "@/hooks/use-timeline-layers";
import { timelineWindow } from "@/lib/timeline";
import type { TimelineZoom } from "@/types";
import { LaneRow } from "./lane-row";
import { LayerBar } from "./layer-bar";
import { LoadRow } from "./load-row";
import { TeamRow } from "./team-row";
import { TimelineAxis } from "./timeline-axis";
import { TimelineGrid } from "./timeline-grid";

type Props = { lanes: TimelineLane[]; zoom: TimelineZoom; now: Date };

/** Charts narrower than this scroll sideways instead of squeezing. */
const MIN_CHART_PX = 760;

/** One lane per hackathon: phases as bars, deadlines as diamonds, optional per-team rows. */
export function LanesView({ lanes, zoom, now }: Props) {
  const { layers, toggle, reset } = useTimelineLayers();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  // Lanes the viewer folded shut while team rows are on.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const w = timelineWindow(zoom, now);
  const labelPx = width > 0 && width < 900 ? 200 : 260;
  const trackPx = Math.max(width, MIN_CHART_PX) - labelPx;

  const fold = (id: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      if (!n.delete(id)) n.add(id);
      return n;
    });

  return (
    <div className="flex flex-col gap-4">
      <LayerBar layers={layers} onToggle={toggle} onReset={reset} />
      <div ref={ref} className="overflow-x-auto overflow-y-hidden">
        <div className="relative min-w-190" style={{ "--lab": `${labelPx}px` } as CSSProperties}>
          <TimelineGrid window={w} weekends={layers.weekends} dense={zoom === "3m"} />
          <TimelineAxis window={w} zoom={zoom} />
          {layers.load && <LoadRow lanes={lanes} window={w} />}
          {lanes.map((lane) => {
            const open = layers.teams && !collapsed.has(lane.hackathonId);
            return (
              <Fragment key={lane.hackathonId}>
                <LaneRow lane={lane} window={w} layers={layers} trackPx={trackPx} now={now} open={open} onToggle={() => fold(lane.hackathonId)} />
                {open && lane.teams.map((t) => <TeamRow key={t.id} team={t} hackathonId={lane.hackathonId} window={w} />)}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
