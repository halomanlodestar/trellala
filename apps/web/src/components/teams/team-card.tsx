import type { HackathonDetail, PersonView, TeamView } from "@trellala/core/types";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { TeamStatusBadge } from "@/components/common/badges";
import { MemberAvatars } from "@/components/common/member-avatars";
import { cn } from "@/lib/utils";
import { MilestoneChecklist } from "./milestone-checklist";
import { TeamFormDialog } from "./team-form-dialog";
import { TeamMilestoneDialog } from "./team-milestone-dialog";
import { TeamStatusSelect } from "./team-status-select";

type Props = { team: TeamView; hackathon: HackathonDetail; people: PersonView[]; takenIds: string[] };

export function TeamCard({ team, hackathon, people, takenIds }: Props) {
  const size = team.members.length;
  const sizeWarning =
    (hackathon.teamSizeMin !== null && size < hackathon.teamSizeMin) || (hackathon.teamSizeMax !== null && size > hackathon.teamSizeMax);
  const missed = team.status === "MISSED";
  const links = [
    { href: team.repoUrl, label: "Repo" },
    { href: team.demoUrl, label: "Demo" },
    { href: team.submissionUrl, label: "Submission" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  return (
    <section className={cn("flex flex-col border-t-2 border-rule pt-3", missed && "border-destructive")}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/hackathons/${hackathon.id}/teams/${team.id}`}
              className={cn("font-serif text-2xl leading-none hover:underline hover:decoration-1 hover:underline-offset-4", missed && "text-destructive")}
            >
              {team.name}
            </Link>
            <TeamStatusBadge status={team.status} />
          </div>
          {team.ideaTitle && <span className="text-sm text-muted-foreground italic">{team.ideaTitle}</span>}
        </div>
        <div className="flex items-center gap-1">
          <TeamStatusSelect team={team} prizes={hackathon.prizes} />
          <TeamFormDialog hackathon={hackathon} team={team} people={people} takenIds={takenIds} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-3 text-sm">
        <MemberAvatars people={team.members} max={6} />
        <span className={cn("text-muted-foreground", sizeWarning && "text-soon")}>
          {team.members.map((m) => m.name).join(", ") || "No members"}
          {sizeWarning && ` · ${size} of ${hackathon.teamSizeMin ?? "?"}–${hackathon.teamSizeMax ?? "?"}`}
        </span>
        {links.length > 0 && (
          <span className="caps ml-auto flex gap-3">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 underline underline-offset-4 hover:text-destructive">
                {l.label} <ArrowUpRight className="size-3" />
              </a>
            ))}
          </span>
        )}
      </div>

      <MilestoneChecklist team={team} eventMilestones={hackathon.milestones} />
      <div className="pt-2">
        <TeamMilestoneDialog teamId={team.id} />
      </div>
    </section>
  );
}
