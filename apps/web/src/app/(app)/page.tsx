import { queueFilterSchema } from "@trellala/core/schemas";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QueueFilters } from "@/components/queue/queue-filters";
import { QueueList } from "@/components/queue/queue-list";
import { loadTagSuggestions } from "@/server/queries/people";
import { loadQueue } from "@/server/queries/queue";

export const metadata: Metadata = { title: "Queue" };

export default async function QueuePage({ searchParams }: PageProps<"/">) {
  const parsed = queueFilterSchema.safeParse(await searchParams);
  const filter = parsed.success ? parsed.data : {};
  const [{ groups }, tags] = await Promise.all([loadQueue(filter), loadTagSuggestions()]);
  return (
    <>
      <PageHeader title="Queue" actions={<QueueFilters tags={tags} />} />
      <QueueList groups={groups} />
    </>
  );
}
