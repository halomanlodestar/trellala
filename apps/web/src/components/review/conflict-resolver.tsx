"use client";

import type { ConflictDetail } from "@trellala/core/types";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResolveConflict } from "@/hooks/use-resolve-conflict";
import { displayValue, sourceLabel } from "@/lib/format";
import { formatIstShort } from "@/lib/time";
import { cn } from "@/lib/utils";

type Props = { conflict: ConflictDetail };

/** Parses the custom input: JSON if it parses (numbers, booleans, null, arrays), else a plain string. */
const parseCustom = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export function ConflictResolver({ conflict }: Props) {
  const router = useRouter();
  const [choice, setChoice] = useState<string>("current");
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const mutation = useResolveConflict({ refresh: false, onSuccess: () => router.push("/review") });

  const options = [
    { id: "current", label: sourceLabel(conflict.currentSource), sub: "current", value: conflict.currentValue },
    ...conflict.candidates.map((c) => ({ id: c.id, label: sourceLabel(c.source), sub: formatIstShort(c.receivedAt), value: c.value })),
  ];

  const resolve = () => {
    const base = { conflictId: conflict.id, note: note || undefined };
    if (choice === "current") mutation.mutate({ ...base, choice: "current" });
    else if (choice === "custom") mutation.mutate({ ...base, choice: "custom", value: parseCustom(custom) });
    else mutation.mutate({ ...base, choice: "candidate", candidateId: choice });
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setChoice(o.id)}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors hover:border-foreground/30",
              choice === o.id && "border-primary ring-2 ring-primary/20",
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{o.label}</span>
              <span>{o.sub}</span>
            </div>
            <span className="text-sm wrap-break-word">{displayValue(o.value)}</span>
            {choice === o.id && <Check className="size-4 self-end text-primary" />}
          </button>
        ))}
        <div className={cn("flex flex-col gap-2 rounded-lg border border-dashed p-3", choice === "custom" && "border-primary ring-2 ring-primary/20")}>
          <label htmlFor="custom-value" className="text-xs font-medium">
            Custom
          </label>
          <Input id="custom-value" value={custom} placeholder="Value" onFocus={() => setChoice("custom")} onChange={(e) => setCustom(e.target.value)} />
        </div>
      </div>
      <Field>
        <FieldLabel htmlFor="note">Note</FieldLabel>
        <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <Button className="self-end" disabled={mutation.isPending || (choice === "custom" && !custom)} onClick={resolve}>
        <Check /> Resolve
      </Button>
    </div>
  );
}
