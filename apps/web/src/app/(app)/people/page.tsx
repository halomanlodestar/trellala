import type { Metadata } from "next";
import Link from "next/link";
import { TeamStatusBadge } from "@/components/common/badges";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { loadPeopleWithTeams } from "@/server/queries/people";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const people = await loadPeopleWithTeams();
  return (
    <>
      <PageHeader title="People" description={`${people.length} on the roster`} />
      <ol className="grid gap-x-12 sm:grid-cols-2">
        {people.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 border-b py-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-rule">
                {p.image && <AvatarImage src={p.image} alt={p.name} className="grayscale" />}
                <AvatarFallback className="bg-transparent font-mono text-xs">{initials(p.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-serif text-2xl leading-tight">{p.name}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{p.email}</span>
              </div>
              <span className="ml-auto flex flex-col items-end" title="Active teams">
                <span className="figures text-xl leading-none">{p.teams.length}</span>
                <span className="caps text-[10px] text-muted-foreground">teams</span>
              </span>
            </div>
            {p.skills.length > 0 && <p className="text-sm text-muted-foreground">{p.skills.join(" · ")}</p>}
            {p.teams.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-sm">
                {p.teams.map((t) => (
                  <li key={t.teamId} className="flex items-center justify-between gap-3">
                    <Link href={`/hackathons/${t.hackathonId}/teams/${t.teamId}`} className="truncate underline-offset-4 hover:underline">
                      {t.hackathonName} <span className="text-muted-foreground">› {t.teamName}</span>
                    </Link>
                    <TeamStatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
