import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "teams", label: "Teams" },
  { id: "activity", label: "Activity" },
  { id: "sources", label: "Sources" },
] as const;

type Props = { hackathonId: string; active: string; teamCount: number };

export function DetailTabs({ hackathonId, active, teamCount }: Props) {
  return (
    <nav className="mb-8 flex gap-6 border-b">
      {TABS.map(({ id, label }) => (
        <Link
          key={id}
          href={id === "overview" ? `/hackathons/${hackathonId}` : `/hackathons/${hackathonId}?tab=${id}`}
          scroll={false}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "caps -mb-px flex h-9 items-center gap-1.5 border-b-2 border-transparent text-muted-foreground hover:text-foreground",
            active === id && "border-foreground text-foreground",
          )}
        >
          {label}
          {id === "teams" && <span className="figures text-muted-foreground">{teamCount}</span>}
        </Link>
      ))}
    </nav>
  );
}
