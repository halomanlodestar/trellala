import { CalendarRange } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarLoader } from "@/components/timeline/calendar-loader";
import { LanesView } from "@/components/timeline/lanes-view";
import { TimelineControls } from "@/components/timeline/timeline-controls";
import { toCalendarEvents } from "@/lib/timeline";
import { timelineParamsSchema } from "@/schemas/timeline";
import { loadTimeline } from "@/server/queries/hackathons";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage({ searchParams }: PageProps<"/timeline">) {
  const params = timelineParamsSchema.parse(await searchParams);
  await connection();
  const now = new Date();
  const { rows, lanes } = await loadTimeline(now);

  return (
    <div data-bleed>
      <PageHeader title="Timeline" description={`${lanes.length} active · IST`} actions={<TimelineControls {...params} />} />
      {rows.length === 0 ? (
        <EmptyState icon={CalendarRange} text="Nothing active" />
      ) : params.view === "calendar" ? (
        <CalendarLoader events={toCalendarEvents(rows)} />
      ) : (
        <LanesView lanes={lanes} zoom={params.zoom} now={now} />
      )}
    </div>
  );
}
