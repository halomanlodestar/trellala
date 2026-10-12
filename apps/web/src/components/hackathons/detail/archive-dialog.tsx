"use client";

import { ARCHIVE_REASON_LABEL, MANUAL_ARCHIVE_REASONS } from "@trellala/core/constants";
import type { ManualArchiveReason } from "@trellala/core/types";
import { Archive } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useArchiveHackathon } from "@/hooks/use-archive-hackathon";

type Props = { hackathonId: string };

export function ArchiveDialog({ hackathonId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ManualArchiveReason>("NOT_INTERESTED");
  const [note, setNote] = useState("");
  const mutation = useArchiveHackathon({ onSuccess: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive /> Archive
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel>Reason</FieldLabel>
          <Select value={reason} onValueChange={(v) => setReason(v as ManualArchiveReason)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_ARCHIVE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ARCHIVE_REASON_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="archive-note">Note</FieldLabel>
          <Textarea id="archive-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate({ hackathonId, reason, note })}>
            Archive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
