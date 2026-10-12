import { CalendarRange } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Gantt } from "@/components/timeline/gantt";
import { ZoomToggle } from "@/components/timeline/zoom-toggle";
import { loadTimeline } from "@/server/queries/hackathons";

export const metadata: Metadata = { title: "Timeline" };

const ZOOM_DAYS = { week: 14, month: 60, quarter: 120 } as const;

export default async function TimelinePage({ searchParams }: PageProps<"/timeline">) {
  const { zoom } = await searchParams;
  const rows = await loadTimeline();
  await connection();
  const days = ZOOM_DAYS[zoom === "week" || zoom === "quarter" ? zoom : "month"];
  const now = new Date();
  const start = new Date(now.getTime() - Math.round(days * 0.2) * 864e5);
  const end = new Date(start.getTime() + days * 864e5);

  return (
    <>
      <PageHeader title="Timeline" actions={<ZoomToggle />} />
      {rows.length === 0 ? <EmptyState icon={CalendarRange} text="Nothing active" /> : <Gantt rows={rows} range={{ start, end, days }} now={now} />}
    </>
  );
}
