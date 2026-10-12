/** @format */

import type { HackathonSummary } from "@trellala/core/types";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  ModeBadge,
  StageBadge,
  Tags,
  TypeBadge,
} from "@/components/common/badges";
import { MemberAvatars } from "@/components/common/member-avatars";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsd } from "@/lib/format";
import { NextActionCell } from "./next-action-cell";

type Props = { hackathons: HackathonSummary[]; hrefBase?: string };

export function HackathonTable({ hackathons }: Props) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Prize</TableHead>
            <TableHead>Next</TableHead>
            <TableHead className="hidden sm:table-cell">Teams</TableHead>
            <TableHead className="hidden lg:table-cell">Stage</TableHead>
            <TableHead className="hidden lg:table-cell text-right">
              Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hackathons.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="max-w-72">
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/hackathons/${h.id}`}
                    className="flex items-center gap-1.5 truncate font-medium hover:underline"
                  >
                    {h.hasMissedTeam && (
                      <AlertTriangle
                        className="size-3.5 shrink-0 text-destructive"
                        aria-label="A team missed a deadline"
                      />
                    )}
                    {h.name}
                  </Link>
                  <Tags tags={h.tags} />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <TypeBadge type={h.type} />
                  <ModeBadge mode={h.mode} />
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col text-sm">
                  <span>{formatUsd(h.estimatedUsd) ?? "—"}</span>
                  {h.prizeSummary && (
                    <span className="text-xs text-muted-foreground">
                      {h.prizeSummary}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <NextActionCell action={h.nextAction} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums">{h.teamCount}</span>
                  <MemberAvatars people={h.members} />
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <StageBadge stage={h.stage} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right tabular-nums">
                {h.priority}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
