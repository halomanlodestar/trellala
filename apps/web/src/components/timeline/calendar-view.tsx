"use client";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/breezy/theme.css";
import "@fullcalendar/react/themes/breezy/palettes/indigo.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import listPlugin from "@fullcalendar/react/list";
import breezyTheme from "@fullcalendar/react/themes/breezy";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { IST } from "@trellala/core/time";
import type { CalendarEvent } from "@/types";

type Props = { events: CalendarEvent[] };

/** Month / list calendar of every milestone, shown in IST. Click an event to open it. */
export function CalendarView({ events }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <div className="trellala-calendar rounded-sm border border-rule bg-card p-3 sm:p-4" data-color-scheme={resolvedTheme === "dark" ? "dark" : "light"}>
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin, breezyTheme]}
        initialView="dayGridMonth"
        timeZone={IST}
        height="auto"
        firstDay={1}
        dayMaxEvents={3}
        headerToolbar={{ start: "title", center: "", end: "today prev,next dayGridMonth,listMonth" }}
        buttons={{ today: { text: "Today" }, dayGridMonth: { text: "Month" }, listMonth: { text: "List" } }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          url: e.url,
          classNames: e.hard ? ["trellala-hard"] : [],
        }))}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          if (info.event.url) router.push(info.event.url);
        }}
      />
    </div>
  );
}
