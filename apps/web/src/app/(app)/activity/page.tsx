import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivityFilters } from "@/components/activity/activity-filters";
import { PageHeader } from "@/components/layout/page-header";
import { loadActivity } from "@/server/queries/activity";
import { loadPeople } from "@/server/queries/people";

export const metadata: Metadata = { title: "Activity" };

const KEYS = ["actorType", "actorUserId", "action"] as const;

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const sp = await searchParams;
  const filters = Object.fromEntries(KEYS.map((k) => [k, typeof sp[k] === "string" ? sp[k] : undefined]));
  const [firstPage, people] = await Promise.all([loadActivity(filters), loadPeople()]);

  return (
    <>
      <PageHeader title="Activity" actions={<ActivityFilters people={people.map(({ id, name }) => ({ id, name }))} />} />
      <ActivityFeed key={JSON.stringify(filters)} filters={filters} firstPage={firstPage} />
    </>
  );
}
