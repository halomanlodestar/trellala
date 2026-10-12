import type { QueueGroup } from "@trellala/core/types";
import { Inbox, Lock } from "lucide-react";
import Link from "next/link";
import { ModeBadge, TypeBadge } from "@/components/common/badges";
import { Deadline } from "@/components/common/deadline";
import { EmptyState } from "@/components/common/empty-state";
import { MemberAvatars } from "@/components/common/member-avatars";
import { cn } from "@/lib/utils";
import type { QueueGroupMeta } from "@/types";
import { QueueItemActions } from "./queue-item-actions";

const GROUPS: QueueGroupMeta = {
  overdue: { label: "Overdue", tone: "danger" },
  today: { label: "Today", tone: "warn" },
  soon: { label: "Next 3 days", tone: "default" },
  week: { label: "This week", tone: "default" },
  later: { label: "Later", tone: "muted" },
};

type Props = { groups: QueueGroup[] };

export function QueueList({ groups }: Props) {
  if (groups.length === 0) return <EmptyState icon={Inbox} text="Nothing due" />;
  return (
    <div className="flex flex-col gap-8">
      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2">
          <h2
            className={cn(
              "text-sm font-medium",
              GROUPS[g.key].tone === "danger" && "text-destructive",
              GROUPS[g.key].tone === "warn" && "text-amber-600 dark:text-amber-400",
              GROUPS[g.key].tone === "muted" && "text-muted-foreground",
            )}
          >
            {GROUPS[g.key].label} <span className="text-muted-foreground">· {g.items.length}</span>
          </h2>
          <ul className="divide-y rounded-lg border">
            {g.items.map((item) => (
              <li
                key={item.id}
                className={cn("flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4", item.overdue && "bg-destructive/5")}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/hackathons/${item.hackathonId}`} className="truncate font-medium hover:underline">
                      {item.hackathonName}
                    </Link>
                    <TypeBadge type={item.hackathonType} />
                    <ModeBadge mode={item.mode} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                    {item.teamId ? (
                      <Link href={`/hackathons/${item.hackathonId}/teams/${item.teamId}`} className="hover:underline">
                        {item.teamName}
                      </Link>
                    ) : (
                      <span className="italic">No team</span>
                    )}
                    <span>›</span>
                    <span className="text-foreground">{item.title}</span>
                    {item.isHardDeadline && <Lock className="size-3" aria-label="Hard deadline" />}
                    {item.teamOnly && <span className="text-xs">(team)</span>}
                  </div>
                  {item.action && <p className="line-clamp-1 text-xs text-muted-foreground">{item.action}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <MemberAvatars people={item.members} />
                  <Deadline at={item.endsAt} className="w-28 justify-end" />
                  {item.teamId && <QueueItemActions teamId={item.teamId} milestoneId={item.milestoneId} />}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
