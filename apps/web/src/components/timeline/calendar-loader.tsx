"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/types";

type Props = { events: CalendarEvent[] };

// FullCalendar touches `window`, so it renders on the client only.
const CalendarView = dynamic(() => import("./calendar-view").then((m) => m.CalendarView), {
  ssr: false,
  loading: () => <Skeleton className="h-160 w-full rounded-sm" />,
});

export function CalendarLoader({ events }: Props) {
  return <CalendarView events={events} />;
}
