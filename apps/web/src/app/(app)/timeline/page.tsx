import { CalendarRange } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { TimelineViews } from "@/components/timeline/timeline-views";
import { ViewToggle } from "@/components/timeline/view-toggle";
import { ganttRange, toCalendarEvents, toGanttTasks } from "@/lib/timeline";
import { loadTimeline } from "@/server/queries/hackathons";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage({ searchParams }: PageProps<"/timeline">) {
  const { view } = await searchParams;
  const rows = await loadTimeline();
  const mode = view === "calendar" ? "calendar" : "gantt";
  await connection();
  const now = new Date();
  const tasks = toGanttTasks(rows);

  return (
    <>
      <PageHeader title="Timeline" description="Every active hackathon, side by side · IST" actions={<ViewToggle />} />
      {rows.length === 0 ? (
        <EmptyState icon={CalendarRange} text="Nothing active" />
      ) : (
        <TimelineViews view={mode} tasks={tasks} range={ganttRange(tasks, now)} now={now} events={toCalendarEvents(rows)} />
      )}
    </>
  );
}
