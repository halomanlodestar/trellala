"use client";

import { RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiscardIngest } from "@/hooks/use-discard-ingest";
import { useRetryIngest } from "@/hooks/use-retry-ingest";

type Props = { eventId: string };

export function IngestEventActions({ eventId }: Props) {
  const retry = useRetryIngest();
  const discard = useDiscardIngest();
  const pending = retry.isPending || discard.isPending;
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => retry.mutate({ eventId })}>
        <RotateCw /> Retry
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => confirm("Discard this event?") && discard.mutate({ eventId })}>
        <Trash2 /> Discard
      </Button>
    </div>
  );
}
