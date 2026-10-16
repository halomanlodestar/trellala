import type { HackathonDetail, PersonView } from "@trellala/core/types";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { TeamCard } from "./team-card";
import { TeamFormDialog } from "./team-form-dialog";

type Props = { hackathon: HackathonDetail; people: PersonView[] };

export function TeamsTab({ hackathon, people }: Props) {
  const takenIds = hackathon.teams.flatMap((t) => t.members.map((m) => m.id));
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <TeamFormDialog hackathon={hackathon} people={people} takenIds={takenIds} />
      </div>
      {hackathon.teams.length === 0 ? (
        <EmptyState icon={Users} text="No teams yet" />
      ) : (
        <div className="grid gap-x-12 gap-y-12 xl:grid-cols-2">
          {hackathon.teams.map((t) => (
            <TeamCard key={t.id} team={t} hackathon={hackathon} people={people} takenIds={takenIds} />
          ))}
        </div>
      )}
    </div>
  );
}
