import type { HackathonDetail, PersonView, TeamView } from "@trellala/core/types";
import { AlertTriangle, ExternalLink, FolderGit2, Link2, Presentation } from "lucide-react";
import Link from "next/link";
import { TeamStatusBadge } from "@/components/common/badges";
import { MemberAvatars } from "@/components/common/member-avatars";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  return (
    <Card className={cn(missed && "border-destructive/50 bg-destructive/5")}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Link href={`/hackathons/${hackathon.id}/teams/${team.id}`} className="flex items-center gap-2 font-semibold hover:underline">
              {missed && <AlertTriangle className="size-4 text-destructive" />}
              {team.name}
            </Link>
            {team.ideaTitle && <span className="text-sm text-muted-foreground">{team.ideaTitle}</span>}
          </div>
          <div className="flex items-center gap-2">
            <TeamStatusBadge status={team.status} />
            <TeamStatusSelect team={team} prizes={hackathon.prizes} />
            <TeamFormDialog hackathon={hackathon} team={team} people={people} takenIds={takenIds} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <MemberAvatars people={team.members} max={6} />
          <span className={cn("text-muted-foreground", sizeWarning && "text-amber-600 dark:text-amber-400")}>
            {team.members.map((m) => m.name).join(", ") || "No members"}
            {sizeWarning && ` · size ${size}, needs ${hackathon.teamSizeMin ?? "?"}–${hackathon.teamSizeMax ?? "?"}`}
          </span>
          <div className="ml-auto flex gap-2 text-muted-foreground">
            {team.repoUrl && <LinkIcon href={team.repoUrl} icon={FolderGit2} label="Repo" />}
            {team.demoUrl && <LinkIcon href={team.demoUrl} icon={Presentation} label="Demo" />}
            {team.submissionUrl && <LinkIcon href={team.submissionUrl} icon={Link2} label="Submission" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <MilestoneChecklist team={team} eventMilestones={hackathon.milestones} />
        <div>
          <TeamMilestoneDialog teamId={team.id} />
        </div>
      </CardContent>
    </Card>
  );
}

function LinkIcon({ href, icon: Icon, label }: { href: string; icon: typeof ExternalLink; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" title={label} className="hover:text-foreground">
      <Icon className="size-4" />
    </a>
  );
}
