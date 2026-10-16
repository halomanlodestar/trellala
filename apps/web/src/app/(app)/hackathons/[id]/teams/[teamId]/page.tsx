import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { SectionHead } from "@/components/hackathons/detail/section-head";
import { TeamCard } from "@/components/teams/team-card";
import { loadActivity } from "@/server/queries/activity";
import { loadTeam } from "@/server/queries/hackathons";
import { loadPeople } from "@/server/queries/people";

export default async function TeamPage({ params }: PageProps<"/hackathons/[id]/teams/[teamId]">) {
  const { teamId } = await params;
  const [{ team, hackathon }, people] = await Promise.all([loadTeam(teamId), loadPeople()]);
  const activity = await loadActivity({ hackathonId: hackathon.id });
  const takenIds = hackathon.teams.flatMap((t) => t.members.map((m) => m.id));

  return (
    <div className="flex flex-col gap-10">
      <Link href={`/hackathons/${hackathon.id}?tab=teams`} className="caps flex w-fit items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> {hackathon.name}
      </Link>
      <TeamCard team={team} hackathon={hackathon} people={people} takenIds={takenIds} />
      {team.ideaDescription && <p className="max-w-prose font-serif text-xl leading-relaxed whitespace-pre-wrap">{team.ideaDescription}</p>}
      <section>
        <SectionHead>Activity</SectionHead>
        <ActivityFeed filters={{ hackathonId: hackathon.id }} firstPage={activity} showHackathon={false} />
      </section>
    </div>
  );
}
