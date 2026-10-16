import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { IngestEventActions } from "@/components/review/ingest-event-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayValue, fieldLabel, sourceLabel } from "@/lib/format";
import { formatIst } from "@/lib/time";
import { loadReview } from "@/server/queries/review";

export const metadata: Metadata = { title: "Review" };

const tab = "caps h-9 flex-none rounded-none px-0 text-muted-foreground data-active:text-foreground";

export default async function ReviewPage() {
  const { conflicts, failed } = await loadReview();
  return (
    <>
      <PageHeader title="Review" description={`${conflicts.length} conflicts · ${failed.length} failed ingests`} />
      <Tabs defaultValue={conflicts.length || !failed.length ? "conflicts" : "failed"}>
        <TabsList variant="line" className="mb-6 h-auto w-full justify-start gap-6 border-b p-0">
          <TabsTrigger value="conflicts" className={tab}>
            Conflicts <span className="figures text-destructive">{conflicts.length || ""}</span>
          </TabsTrigger>
          <TabsTrigger value="failed" className={tab}>
            Failed <span className="figures text-destructive">{failed.length || ""}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conflicts">
          {conflicts.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="No conflicts" />
          ) : (
            <ol className="border-t border-rule">
              {conflicts.map((c) => (
                <li key={c.id} className="border-b">
                  <Link href={`/review/conflicts/${c.id}`} className="grid grid-cols-[5rem_1fr_auto] items-center gap-x-4 py-3 hover:bg-accent/50">
                    <span className="figures text-xs text-muted-foreground">{formatIst(c.updatedAt, "d MMM HH:mm")}</span>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium">{c.hackathonName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{fieldLabel(c.fieldPath)}</span>
                      <span className="truncate text-sm">
                        {displayValue(c.currentValue)} <span className="text-muted-foreground">· {sourceLabel(c.currentSource)}</span>
                      </span>
                    </div>
                    <span className="caps text-destructive">+{c.candidateCount}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
        <TabsContent value="failed">
          {failed.length === 0 ? (
            <EmptyState icon={CheckCircle2} text="No failed ingests" />
          ) : (
            <ol className="border-t border-rule">
              {failed.map((e) => (
                <li key={e.id} className="grid grid-cols-[5rem_1fr] items-start gap-x-4 gap-y-2 border-b py-3 sm:grid-cols-[5rem_1fr_auto]">
                  <span className="figures text-xs text-muted-foreground">{formatIst(e.createdAt, "d MMM HH:mm")}</span>
                  <Link href={`/review/ingest/${e.id}`} className="flex min-w-0 flex-col gap-0.5 hover:underline">
                    <span className="font-medium">
                      {e.source} · {e.externalId ?? e.sourceUrl ?? e.id}
                    </span>
                    <span className="line-clamp-2 font-mono text-xs text-destructive">{e.error}</span>
                  </Link>
                  <div className="col-start-2 sm:col-start-auto">
                    <IngestEventActions eventId={e.id} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
