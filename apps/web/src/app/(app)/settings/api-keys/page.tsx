import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { CreateApiKeyDialog } from "@/components/settings/create-api-key-dialog";
import { RevokeApiKeyButton } from "@/components/settings/revoke-api-key-button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIstShort } from "@/lib/time";
import { loadApiKeys } from "@/server/queries/people";

export const metadata: Metadata = { title: "API keys" };

export default async function ApiKeysPage() {
  const keys = await loadApiKeys();
  return (
    <>
      <PageHeader title="API keys" actions={<CreateApiKeyDialog />} />
      {keys.length === 0 ? (
        <EmptyState icon={KeyRound} text="No keys" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="hidden md:table-cell">Last used</TableHead>
                <TableHead className="hidden md:table-cell">By</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id} className={k.revokedAt ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{k.source}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{k.prefix}…</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{k.lastUsedAt ? formatIstShort(k.lastUsedAt) : "—"}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{k.createdByName}</TableCell>
                  <TableCell className="text-right">{k.revokedAt ? <Badge variant="secondary">Revoked</Badge> : <RevokeApiKeyButton apiKeyId={k.id} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
