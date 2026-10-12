import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ConflictResolver } from "@/components/review/conflict-resolver";
import { displayValue, fieldLabel, sourceLabel } from "@/lib/format";
import { formatIst } from "@/lib/time";
import { loadConflict } from "@/server/queries/review";

export default async function ConflictPage({ params }: PageProps<"/review/conflicts/[id]">) {
  const { id } = await params;
  const c = await loadConflict(id);

  return (
    <>
      <Link href="/review" className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Review
      </Link>
      <PageHeader title={fieldLabel(c.fieldPath)}>
        <Link href={`/hackathons/${c.hackathonId}`} className="text-sm text-muted-foreground hover:underline">
          {c.hackathonName}
        </Link>
      </PageHeader>
      {c.status === "OPEN" ? (
        <ConflictResolver conflict={c} />
      ) : (
        <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
          <span>
            Resolved to <strong>{displayValue(c.resolvedValue)}</strong>
          </span>
          <span className="text-muted-foreground">
            {c.resolvedByName} · {c.resolvedAt && formatIst(c.resolvedAt)}
          </span>
          {c.note && <span className="italic">{c.note}</span>}
          <ul className="mt-2 text-xs text-muted-foreground">
            {c.candidates.map((x) => (
              <li key={x.id}>
                {sourceLabel(x.source)}: {displayValue(x.value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
