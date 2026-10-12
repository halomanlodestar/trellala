import { connection } from "next/server";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { DetailTabs } from "@/components/hackathons/detail/detail-tabs";
import { HackathonHeader } from "@/components/hackathons/detail/hackathon-header";
import { Overview } from "@/components/hackathons/detail/overview";
import { Sources } from "@/components/hackathons/detail/sources";
import { TeamsTab } from "@/components/teams/teams-tab";
import { loadActivity } from "@/server/queries/activity";
import { loadHackathon, loadHackathonSources } from "@/server/queries/hackathons";
import { loadPeople } from "@/server/queries/people";

export default async function HackathonPage({ params, searchParams }: PageProps<"/hackathons/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = typeof sp.tab === "string" ? sp.tab : "overview";
  const hackathon = await loadHackathon(id);
  await connection();
  const now = new Date();

  return (
    <>
      <HackathonHeader hackathon={hackathon} />
      <DetailTabs hackathonId={id} active={tab} teamCount={hackathon.teamCount} />
      {tab === "teams" && <TeamsTab hackathon={hackathon} people={await loadPeople()} />}
      {tab === "activity" && <ActivityFeed filters={{ hackathonId: id }} firstPage={await loadActivity({ hackathonId: id })} showHackathon={false} />}
      {tab === "sources" && <Sources hackathon={hackathon} events={await loadHackathonSources(id)} />}
      {tab !== "teams" && tab !== "activity" && tab !== "sources" && <Overview hackathon={hackathon} now={now} />}
    </>
  );
}
