"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent, GanttTask } from "@/types";

// Both libraries touch `window`, so they render on the client only.
const GanttView = dynamic(() => import("./gantt-view").then((m) => m.GanttView), {
  ssr: false,
  loading: () => <Skeleton className="h-[calc(100svh-15rem)] min-h-[420px] w-full rounded-sm" />,
});
const CalendarView = dynamic(() => import("./calendar-view").then((m) => m.CalendarView), {
  ssr: false,
  loading: () => <Skeleton className="h-[640px] w-full rounded-sm" />,
});

type Props = { view: "gantt" | "calendar"; tasks: GanttTask[]; range: { start: Date; end: Date }; now: Date; events: CalendarEvent[] };

export function TimelineViews({ view, tasks, range, now, events }: Props) {
  return view === "calendar" ? <CalendarView events={events} /> : <GanttView tasks={tasks} range={range} now={now} />;
}
