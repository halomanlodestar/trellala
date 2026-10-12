import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { IngestEventActions } from "@/components/review/ingest-event-actions";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayValue, fieldLabel, sourceLabel } from "@/lib/format";
import { formatIstShort } from "@/lib/time";
import { loadReview } from "@/server/queries/review";

export const metadata: Metadata = { title: "Review" };

export default async function ReviewPage() {
  const { conflicts, failed } = await loadReview();
  return (
    <>
      <PageHeader title="Review" />
      <Tabs defaultValue={conflicts.length || !failed.length ? "conflicts" : "failed"}>
        <TabsList>
          <TabsTrigger value="conflicts">
            Conflicts <Badge variant="secondary">{conflicts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed <Badge variant="secondary">{failed.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conflicts" className="mt-4">
          {conflicts.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="No conflicts" />
          ) : (
            <ul className="divide-y rounded-lg border">
              {conflicts.map((c) => (
                <li key={c.id}>
                  <Link href={`/review/conflicts/${c.id}`} className="flex flex-col gap-1 p-3 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{c.hackathonName}</span>
                      <span className="text-sm text-muted-foreground">{fieldLabel(c.fieldPath)}</span>
                    </div>
                    <span className="truncate text-sm">
                      {displayValue(c.currentValue)} <span className="text-muted-foreground">({sourceLabel(c.currentSource)})</span>
                    </span>
                    <Badge variant="outline">+{c.candidateCount}</Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatIstShort(c.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="failed" className="mt-4">
          {failed.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="No failed ingests" />
          ) : (
            <ul className="divide-y rounded-lg border">
              {failed.map((e) => (
                <li key={e.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4">
                  <Link href={`/review/ingest/${e.id}`} className="flex min-w-0 flex-1 flex-col hover:underline">
                    <span className="font-medium">
                      {e.source} · {e.externalId ?? e.sourceUrl ?? e.id}
                    </span>
                    <span className="line-clamp-2 font-mono text-xs text-destructive">{e.error}</span>
                  </Link>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatIstShort(e.createdAt)}</span>
                  <IngestEventActions eventId={e.id} />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
