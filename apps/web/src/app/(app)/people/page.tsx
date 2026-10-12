import type { Metadata } from "next";
import Link from "next/link";
import { TeamStatusBadge } from "@/components/common/badges";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { initials } from "@/lib/format";
import { loadPeopleWithTeams } from "@/server/queries/people";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const people = await loadPeopleWithTeams();
  return (
    <>
      <PageHeader title="People" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  {p.image && <AvatarImage src={p.image} alt={p.name} />}
                  <AvatarFallback>{initials(p.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{p.email}</span>
                </div>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums" title="Active teams">
                  {p.teams.length}
                </span>
              </div>
              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.skills.map((s) => (
                    <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {p.teams.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {p.teams.map((t) => (
                    <li key={t.teamId} className="flex items-center justify-between gap-2">
                      <Link href={`/hackathons/${t.hackathonId}/teams/${t.teamId}`} className="truncate hover:underline">
                        {t.hackathonName} <span className="text-muted-foreground">· {t.teamName}</span>
                      </Link>
                      <TeamStatusBadge status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
