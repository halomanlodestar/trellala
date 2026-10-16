import type { HackathonSummary } from "@trellala/core/types";
import { HackathonCard } from "./hackathon-card";

type Props = { hackathons: HackathonSummary[] };

export function HackathonGrid({ hackathons }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {hackathons.map((h) => (
        <HackathonCard key={h.id} hackathon={h} className="h-full" />
      ))}
    </div>
  );
}
