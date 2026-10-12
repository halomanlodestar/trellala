import type { HackathonDetail, IngestEventView } from "@trellala/core/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldLabel, sourceLabel } from "@/lib/format";
import { formatIstShort } from "@/lib/time";

type Props = { hackathon: HackathonDetail; events: IngestEventView[] };

export function Sources({ hackathon, events }: Props) {
  const fields = Object.entries(hackathon.fieldSources).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ingests</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Manual only</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs tabular-nums">
                      <Link href={`/review/ingest/${e.id}`} className="hover:underline">
                        {formatIstShort(e.createdAt)}
                      </Link>
                    </TableCell>
                    <TableCell>{e.source}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "FAILED" ? "destructive" : "secondary"}>{e.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Field owners</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1 text-sm">
            {fields.map(([path, source]) => (
              <li key={path} className="flex justify-between gap-3">
                <span className="truncate text-muted-foreground">{fieldLabel(path)}</span>
                <span className="shrink-0">{sourceLabel(source)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
