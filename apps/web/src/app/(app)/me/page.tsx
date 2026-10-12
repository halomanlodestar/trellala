import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QueueList } from "@/components/queue/queue-list";
import { loadQueue } from "@/server/queries/queue";

export const metadata: Metadata = { title: "Mine" };

export default async function MinePage() {
  const { groups } = await loadQueue({ mine: true });
  return (
    <>
      <PageHeader title="My actions" />
      <QueueList groups={groups} />
    </>
  );
}
