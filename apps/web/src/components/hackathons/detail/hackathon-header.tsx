import { ARCHIVE_REASON_LABEL } from "@trellala/core/constants";
import type { HackathonDetail } from "@trellala/core/types";
import { Archive, ExternalLink, MapPin, Pencil, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { ModeBadge, Tags, TypeBadge } from "@/components/common/badges";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { formatIst } from "@/lib/time";
import { ArchiveDialog } from "./archive-dialog";
import { StageSelect } from "./stage-select";
import { UnarchiveButton } from "./unarchive-button";

type Props = { hackathon: HackathonDetail };

export function HackathonHeader({ hackathon: h }: Props) {
  const teamSize = h.teamSizeMin || h.teamSizeMax ? `${h.teamSizeMin ?? "?"}–${h.teamSizeMax ?? "?"}` : null;
  return (
    <div className="mb-6 flex flex-col gap-4">
      {h.archivedAt && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-sm">
          <Archive className="size-4" />
          <span className="font-medium">{h.archiveReason ? ARCHIVE_REASON_LABEL[h.archiveReason] : "Archived"}</span>
          <span className="text-muted-foreground">
            · {h.archivedByName ?? "System"} · {formatIst(h.archivedAt)}
          </span>
          {h.archiveNote && <span className="text-muted-foreground">· {h.archiveNote}</span>}
          <div className="ml-auto">
            <UnarchiveButton hackathonId={h.id} />
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{h.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <TypeBadge type={h.type} />
            <ModeBadge mode={h.mode} />
            {h.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {h.location}
              </span>
            )}
            {teamSize && (
              <span className="flex items-center gap-1">
                <Users className="size-3.5" /> {teamSize}
              </span>
            )}
            {h.estimatedUsd !== null && <span>{formatUsd(h.estimatedUsd)}</span>}
            {h.sourceUrl && (
              <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <ExternalLink className="size-3.5" /> Source
              </a>
            )}
            {h.openConflictCount > 0 && (
              <Link href="/review" className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="size-3.5" /> {h.openConflictCount}
              </Link>
            )}
          </div>
          <Tags tags={h.tags} />
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
    </div>
  );
}
