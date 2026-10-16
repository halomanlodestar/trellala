import { archiveFilterSchema } from "@trellala/core/schemas";
import { Archive } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveFilter } from "@/components/archive/archive-filter";
import { ArchiveReasonBadge, TypeBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/empty-state";
import { MemberAvatars } from "@/components/common/member-avatars";
import { UnarchiveButton } from "@/components/hackathons/detail/unarchive-button";
import { PageHeader } from "@/components/layout/page-header";
import { formatUsd } from "@/lib/format";
import { formatIst } from "@/lib/time";
import { loadArchived } from "@/server/queries/hackathons";

export const metadata: Metadata = { title: "Archive" };

const COLS = "grid grid-cols-[5rem_1fr_auto] gap-x-4 md:grid-cols-[6rem_minmax(0,1.6fr)_minmax(0,1fr)_5.5rem_6rem_auto]";

export default async function ArchivePage({ searchParams }: PageProps<"/archive">) {
  const parsed = archiveFilterSchema.safeParse(await searchParams);
  const rows = await loadArchived(parsed.success ? parsed.data.reason : undefined);

  return (
    <>
      <PageHeader title="Archive" description={`${rows.length} filed away`} actions={<ArchiveFilter />} />
      {rows.length === 0 ? (
        <EmptyState icon={Archive} text="Nothing archived" />
      ) : (
        <div>
          <div className={`${COLS} caps border-b border-rule pb-2 text-muted-foreground`}>
            <span>Filed</span>
            <span>Hackathon</span>
            <span className="hidden md:block">Reason</span>
            <span className="hidden text-right md:block">Prize</span>
            <span className="hidden md:block">Members</span>
            <span />
          </div>
          <ol>
            {rows.map((h) => (
              <li key={h.id} className={`${COLS} items-center border-b py-3 text-muted-foreground`}>
                <span className="figures text-xs">{h.archivedAt ? formatIst(h.archivedAt, "d MMM yy") : "—"}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link href={`/hackathons/${h.id}`} className="truncate font-medium text-foreground underline-offset-4 hover:underline">
                    {h.name}
                  </Link>
                  <span className="flex gap-3">
                    <TypeBadge type={h.type} />
                    <span className="md:hidden">
                      <ArchiveReasonBadge reason={h.archiveReason} />
                    </span>
                  </span>
                </div>
                <span className="hidden md:block">
                  <ArchiveReasonBadge reason={h.archiveReason} />
                </span>
                <span className="figures hidden text-right text-sm md:block">{formatUsd(h.estimatedUsd) ?? "—"}</span>
                <span className="hidden md:block">
                  <MemberAvatars people={h.members} max={3} />
                </span>
                <span className="text-right">
                  <UnarchiveButton hackathonId={h.id} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
