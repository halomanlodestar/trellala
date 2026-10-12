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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUsd } from "@/lib/format";
import { formatIstShort } from "@/lib/time";
import { loadArchived } from "@/server/queries/hackathons";

export const metadata: Metadata = { title: "Archive" };

export default async function ArchivePage({ searchParams }: PageProps<"/archive">) {
  const parsed = archiveFilterSchema.safeParse(await searchParams);
  const rows = await loadArchived(parsed.success ? parsed.data.reason : undefined);

  return (
    <>
      <PageHeader title="Archive" actions={<ArchiveFilter />} />
      {rows.length === 0 ? (
        <EmptyState icon={Archive} text="Nothing archived" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="hidden md:table-cell">Prize</TableHead>
                <TableHead className="hidden sm:table-cell">Teams</TableHead>
                <TableHead>Archived</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeBadge type={h.type} />
                      <Link href={`/hackathons/${h.id}`} className="font-medium hover:underline">
                        {h.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArchiveReasonBadge reason={h.archiveReason} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatUsd(h.estimatedUsd) ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <MemberAvatars people={h.members} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">{h.archivedAt && formatIstShort(h.archivedAt)}</TableCell>
                  <TableCell className="text-right">
                    <UnarchiveButton hackathonId={h.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
