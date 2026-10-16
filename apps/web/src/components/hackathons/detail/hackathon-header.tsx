import { ARCHIVE_REASON_LABEL } from "@trellala/core/constants";
import type { HackathonDetail } from "@trellala/core/types";
import { ArrowLeft, ArrowUpRight, Pencil } from "lucide-react";
import Link from "next/link";
import { KindLine, Tags } from "@/components/common/badges";
import { Deadline } from "@/components/common/deadline";
import { MemberAvatars } from "@/components/common/member-avatars";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { formatIst } from "@/lib/time";
import { ArchiveDialog } from "./archive-dialog";
import { Fact } from "./fact";
import { StageSelect } from "./stage-select";
import { TimelineStrip } from "./timeline-strip";
import { UnarchiveButton } from "./unarchive-button";

type Props = { hackathon: HackathonDetail };

export function HackathonHeader({ hackathon: h }: Props) {
  const teamSize = h.teamSizeMin || h.teamSizeMax ? `${h.teamSizeMin ?? "?"}–${h.teamSizeMax ?? "?"} per team` : null;
  const meta = [h.location, teamSize].filter(Boolean);

  return (
    <div className="mb-8 flex flex-col gap-6">
      <Link href={h.archivedAt ? "/archive" : "/hackathons"} className="caps flex w-fit items-center gap-1.5 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> {h.archivedAt ? "Archive" : "Hackathons"}
      </Link>

      {h.archivedAt && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-dashed border-rule px-4 py-2.5 text-sm">
          <span className="caps">Archived</span>
          <span className="font-medium">{h.archiveReason ? ARCHIVE_REASON_LABEL[h.archiveReason] : "—"}</span>
          <span className="text-muted-foreground">
            {h.archivedByName ?? "System"} · <span className="figures">{formatIst(h.archivedAt)}</span>
            {h.archiveNote && ` · ${h.archiveNote}`}
          </span>
          <div className="ml-auto">
            <UnarchiveButton hackathonId={h.id} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <KindLine type={h.type} mode={h.mode} />
            <Tags tags={h.tags} />
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight text-balance md:text-6xl">{h.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {meta.map((m, i) => (
              <span key={m} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>·</span>}
                {m}
              </span>
            ))}
            {h.sourceUrl && (
              <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-foreground underline underline-offset-4 hover:text-destructive">
                Source <ArrowUpRight className="size-3" />
              </a>
            )}
            {h.openConflictCount > 0 && (
              <Link href="/review" className="text-destructive underline underline-offset-4">
                {h.openConflictCount} to review
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StageSelect hackathonId={h.id} stage={h.stage} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/hackathons/${h.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
          {!h.archivedAt && <ArchiveDialog hackathonId={h.id} />}
        </div>
      </div>

      <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-4 sm:divide-x">
        <Fact label="Prize" sub={h.prizeSummary}>
          <span className="figures">{formatUsd(h.estimatedUsd) ?? "—"}</span>
        </Fact>
        <Fact label="Next" sub={h.nextAction?.title ?? null}>
          {h.nextAction ? <Deadline at={h.nextAction.endsAt} className="items-start text-xl" /> : "—"}
        </Fact>
        <Fact label="Teams" sub={h.members.map((m) => m.name.split(" ")[0]).join(", ") || null}>
          <span className="flex items-center gap-3">
            <span className="figures">{h.teamCount}</span>
            <MemberAvatars people={h.members} max={4} />
          </span>
        </Fact>
        <Fact label="Priority" sub={h.fitScore ? `fit ${h.fitScore}/5` : null}>
          <span className="figures">{h.priority}</span>
        </Fact>
      </dl>

      <TimelineStrip milestones={h.milestones} />
    </div>
  );
}
