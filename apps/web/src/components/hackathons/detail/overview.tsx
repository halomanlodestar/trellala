import { PRIZE_KIND_LABEL } from "@trellala/core/constants";
import type { HackathonDetail } from "@trellala/core/types";
import { ArrowUpRight } from "lucide-react";
import { formatUsd } from "@/lib/format";
import { MilestoneTimeline } from "./milestone-timeline";
import { SectionHead } from "./section-head";

type Props = { hackathon: HackathonDetail; now: Date };

export function Overview({ hackathon: h, now }: Props) {
  const details = [
    { label: "Eligibility", value: h.eligibility },
    { label: "Effort", value: h.effortEstimate !== null ? `${h.effortEstimate}h` : null },
    { label: "Fit", value: h.fitScore !== null ? `${h.fitScore}/5` : null },
    { label: "Description", value: h.description },
    { label: "Notes", value: h.notes },
  ].filter((d) => d.value);

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section>
        <SectionHead>Schedule</SectionHead>
        <MilestoneTimeline milestones={h.milestones} now={now} />
      </section>

      <div className="flex flex-col gap-10">
        <section>
          <SectionHead>Prizes</SectionHead>
          {h.prizes.length === 0 ? (
            <p className="border-t border-rule pt-3 text-sm text-muted-foreground">None listed</p>
          ) : (
            <ul className="border-t border-rule">
              {h.prizes.map((p) => (
                <li key={p.id} className="flex flex-col gap-0.5 border-b py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{p.title}</span>
                    <span className="figures text-sm">
                      {p.amount !== null ? `${p.amount.toLocaleString("en-IN")} ${p.currency ?? ""}` : PRIZE_KIND_LABEL[p.kind]}
                    </span>
                  </div>
                  {(p.description || p.estimatedUsd !== null) && (
                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                      <span>{p.description}</span>
                      {p.estimatedUsd !== null && <span className="figures shrink-0">≈ {formatUsd(p.estimatedUsd)}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {h.importantLinks.length > 0 && (
          <section>
            <SectionHead>Links</SectionHead>
            <ul className="border-t border-rule">
              {h.importantLinks.map((l) => (
                <li key={`${l.label}:${l.url}`} className="border-b py-3 text-sm">
                  <a href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline-offset-4 hover:text-destructive hover:underline">
                    {l.label} <ArrowUpRight className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {details.length > 0 && (
          <section>
            <SectionHead>Details</SectionHead>
            <dl className="border-t border-rule">
              {details.map((d) => (
                <div key={d.label} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b py-3 text-sm">
                  <dt className="caps pt-0.5 text-muted-foreground">{d.label}</dt>
                  <dd className="whitespace-pre-wrap">{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
