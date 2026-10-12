/** @format */

import {
  HACKATHON_STAGE_LABEL,
  HACKATHON_STAGES,
} from "@trellala/core/constants";
import type { HackathonSummary } from "@trellala/core/types";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ModeBadge, Tags, TypeBadge } from "@/components/common/badges";
import { MemberAvatars } from "@/components/common/member-avatars";
import { formatUsd } from "@/lib/format";
import { NextActionCell } from "./next-action-cell";

type Props = { hackathons: HackathonSummary[] };

export function HackathonBoard({ hackathons }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {HACKATHON_STAGES.map((stage) => {
        const items = hackathons.filter((h) => h.stage === stage);
        return (
          <section
            key={stage}
            className="flex flex-col gap-2 rounded-lg bg-muted/40 p-2"
          >
            <h2 className="px-1 text-sm font-medium">
              {HACKATHON_STAGE_LABEL[stage]}{" "}
              <span className="text-muted-foreground">· {items.length}</span>
            </h2>
            {items.map((h) => (
              <Link
                key={h.id}
                href={`/hackathons/${h.id}`}
                className="flex flex-col gap-2 rounded-md border bg-card p-3 shadow-xs transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    {h.hasMissedTeam && (
                      <AlertTriangle className="size-3.5 text-destructive" />
                    )}
                    {h.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatUsd(h.estimatedUsd)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <TypeBadge type={h.type} />
                  <ModeBadge mode={h.mode} />
                </div>
                <NextActionCell action={h.nextAction} />
                <div className="flex items-center justify-between">
                  <Tags tags={h.tags} />
                  <MemberAvatars people={h.members} max={3} />
                </div>
              </Link>
            ))}
          </section>
        );
      })}
    </div>
  );
}
