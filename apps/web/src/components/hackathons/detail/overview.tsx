import { PRIZE_KIND_LABEL } from "@trellala/core/constants";
import type { HackathonDetail } from "@trellala/core/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";
import { MilestoneTimeline } from "./milestone-timeline";

type Props = { hackathon: HackathonDetail; now: Date };

export function Overview({ hackathon: h, now }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneTimeline milestones={h.milestones} now={now} />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prizes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {h.prizes.length === 0 && <p className="text-sm text-muted-foreground">None listed</p>}
            {h.prizes.map((p) => (
              <div key={p.id} className="flex flex-col">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-sm tabular-nums">
                    {p.amount !== null ? `${p.amount.toLocaleString("en-IN")} ${p.currency ?? ""}` : PRIZE_KIND_LABEL[p.kind]}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.description}</span>
                  {p.estimatedUsd !== null && <span>≈ {formatUsd(p.estimatedUsd)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Detail label="Eligibility" value={h.eligibility} />
            <Detail label="Effort" value={h.effortEstimate !== null ? `${h.effortEstimate}h` : null} />
            <Detail label="Fit" value={h.fitScore !== null ? `${h.fitScore}/5` : null} />
            <Detail label="Score" value={String(h.priority)} />
            <Detail label="Description" value={h.description} />
            <Detail label="Notes" value={h.notes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}
