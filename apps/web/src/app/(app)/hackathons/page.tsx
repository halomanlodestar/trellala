import { hackathonListFilterSchema } from "@trellala/core/schemas";
import { LayoutList, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { HackathonBoard } from "@/components/hackathons/hackathon-board";
import { HackathonFilters } from "@/components/hackathons/hackathon-filters";
import { HackathonTable } from "@/components/hackathons/hackathon-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { loadHackathons } from "@/server/queries/hackathons";
import { loadPeople, loadTagSuggestions } from "@/server/queries/people";

export const metadata: Metadata = { title: "Hackathons" };

export default async function HackathonsPage({ searchParams }: PageProps<"/hackathons">) {
  const sp = await searchParams;
  const parsed = hackathonListFilterSchema.safeParse(sp);
  const filter = parsed.success ? parsed.data : hackathonListFilterSchema.parse({});
  const [hackathons, tags, people] = await Promise.all([loadHackathons(filter), loadTagSuggestions(), loadPeople()]);
  const board = sp.view === "board";

  return (
    <>
      <PageHeader
        title="Hackathons"
        actions={
          <Button asChild size="sm">
            <Link href="/hackathons/new">
              <Plus /> New
            </Link>
          </Button>
        }
      >
        <HackathonFilters tags={tags} people={people.map(({ id, name }) => ({ id, name }))} />
      </PageHeader>
      {hackathons.length === 0 ? (
        <EmptyState icon={LayoutList} text="No hackathons" />
      ) : board ? (
        <HackathonBoard hackathons={hackathons} />
      ) : (
        <HackathonTable hackathons={hackathons} />
      )}
    </>
  );
}
