"use client";

import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnarchiveHackathon } from "@/hooks/use-unarchive-hackathon";

type Props = { hackathonId: string };

export function UnarchiveButton({ hackathonId }: Props) {
  const mutation = useUnarchiveHackathon();
  return (
    <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ hackathonId })}>
      <ArchiveRestore /> Restore
    </Button>
  );
}
