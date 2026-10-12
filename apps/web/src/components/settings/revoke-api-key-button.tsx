"use client";

import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRevokeApiKey } from "@/hooks/use-revoke-api-key";

type Props = { apiKeyId: string };

export function RevokeApiKeyButton({ apiKeyId }: Props) {
  const mutation = useRevokeApiKey();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={mutation.isPending}
      onClick={() => confirm("Revoke this key? Scrapers using it will get 403.") && mutation.mutate({ apiKeyId })}
    >
      <Ban /> Revoke
    </Button>
  );
}
