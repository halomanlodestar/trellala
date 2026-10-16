import type { QueueGroup } from "@trellala/core/types";
import { cn } from "@/lib/utils";

type Props = { groups: QueueGroup[] };

/** One-line tally under the page title: "2 late · 1 today · 4 this week · 6 hackathons". */
export function QueueStats({ groups }: Props) {
  const count = (...keys: string[]) => groups.filter((g) => keys.includes(g.key)).reduce((n, g) => n + g.items.length, 0);
  const hackathons = new Set(groups.flatMap((g) => g.items.map((i) => i.hackathonId))).size;
  const stats = [
    { label: "late", value: count("overdue"), tone: "text-destructive" },
    { label: "today", value: count("today"), tone: "text-soon" },
    { label: "this week", value: count("soon", "week"), tone: "text-foreground" },
    { label: hackathons === 1 ? "hackathon" : "hackathons", value: hackathons, tone: "text-foreground" },
  ];
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {stats.map(({ label, value, tone }, i) => (
        <span key={label} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden>·</span>}
          <span>
            <span className={cn("figures", value > 0 && tone)}>{value}</span> {label}
          </span>
        </span>
      ))}
    </span>
  );
}
