import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { JsonBlock } from "@/components/common/json-block";
import { PageHeader } from "@/components/layout/page-header";
import { IngestEventActions } from "@/components/review/ingest-event-actions";
import { Badge } from "@/components/ui/badge";
import { formatIst } from "@/lib/time";
import { loadIngestEvent } from "@/server/queries/review";

export default async function IngestEventPage({ params }: PageProps<"/review/ingest/[eventId]">) {
  const { eventId } = await params;
  const e = await loadIngestEvent(eventId);

  return (
    <>
      <Link href="/review" className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Review
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {e.source} <Badge variant={e.status === "FAILED" ? "destructive" : "secondary"}>{e.status}</Badge>
          </span>
        }
        actions={e.status === "FAILED" ? <IngestEventActions eventId={e.id} /> : undefined}
      >
        <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
          <span>{formatIst(e.createdAt)} IST</span>
          <span>{e.apiKeyName ?? "—"}</span>
          <span>Attempts {e.attempts}</span>
          {e.hackathonId && (
            <Link href={`/hackathons/${e.hackathonId}`} className="hover:underline">
              {e.hackathonName}
            </Link>
          )}
        </div>
      </PageHeader>
      <div className="flex flex-col gap-4">
        {e.error && <pre className="rounded-md bg-destructive/10 p-3 font-mono text-xs whitespace-pre-wrap text-destructive">{e.error}</pre>}
        {e.result !== null && <JsonBlock value={e.result} />}
        <JsonBlock value={e.payload} />
      </div>
    </>
  );
}
