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
    <div className="mb-6 flex gap-1 border-b">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={t.id === "overview" ? `/hackathons/${hackathonId}` : `/hackathons/${hackathonId}?tab=${t.id}`}
          scroll={false}
          className={cn(
            "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
            active === t.id && "border-foreground font-medium text-foreground",
          )}
        >
          {t.label}
          {t.id === "teams" && <span className="ml-1 text-muted-foreground">{teamCount}</span>}
        </Link>
      ))}
    </div>
  );
}
