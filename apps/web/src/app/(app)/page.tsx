import { queueFilterSchema } from "@trellala/core/schemas";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QueueFilters } from "@/components/queue/queue-filters";
import { QueueList } from "@/components/queue/queue-list";
import { QueueStats } from "@/components/queue/queue-stats";
import { loadTagSuggestions } from "@/server/queries/people";
import { loadQueue } from "@/server/queries/queue";

export const metadata: Metadata = { title: "Queue" };

export default async function QueuePage({ searchParams }: PageProps<"/">) {
  const parsed = queueFilterSchema.safeParse(await searchParams);
  const filter = parsed.success ? parsed.data : {};
  const [{ groups }, tags] = await Promise.all([loadQueue(filter), loadTagSuggestions()]);
  return (
    <>
      <PageHeader title="The queue" description={<QueueStats groups={groups} />} actions={<QueueFilters tags={tags} />} />
      <QueueList key={JSON.stringify(filter)} groups={groups} />
    </>
  );
}
