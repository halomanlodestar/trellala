import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QueueList } from "@/components/queue/queue-list";
import { QueueStats } from "@/components/queue/queue-stats";
import { loadQueue } from "@/server/queries/queue";

export const metadata: Metadata = { title: "My work" };

export default async function MinePage() {
  const { groups } = await loadQueue({ mine: true });
  return (
    <>
      <PageHeader title="My work" description={<QueueStats groups={groups} />} />
      <QueueList groups={groups} />
    </>
  );
}
