import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ActivityFeed } from "@/components/activity/activity-feed";
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
    <div className="flex flex-col gap-6">
      <Link href={`/hackathons/${hackathon.id}?tab=teams`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> {hackathon.name}
      </Link>
      <TeamCard team={team} hackathon={hackathon} people={people} takenIds={takenIds} />
      {team.ideaDescription && <p className="text-sm whitespace-pre-wrap">{team.ideaDescription}</p>}
      <ActivityFeed filters={{ hackathonId: hackathon.id }} firstPage={activity} showHackathon={false} />
    </div>
  );
}
