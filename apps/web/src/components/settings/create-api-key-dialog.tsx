"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createApiKeySchema } from "@trellala/core/schemas";
import { Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateApiKey } from "@/hooks/use-create-api-key";
import type { ApiKeyFormData, ApiKeyFormInput } from "@/types/forms";

export function CreateApiKeyDialog() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const form = useForm<ApiKeyFormInput, unknown, ApiKeyFormData>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: "", source: "" },
  });
  const mutation = useCreateApiKey((created) => setToken(created.token));
  const err = form.formState.errors;

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setToken(null);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{token ? "Copy your key" : "New API key"}</DialogTitle>
        </DialogHeader>
        {token ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input readOnly value={token} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button
                size="icon"
                variant="outline"
                aria-label="Copy"
                onClick={() => navigator.clipboard.writeText(token).then(() => toast.success("Copied"))}
              >
                <Copy />
              </Button>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <KeyRound className="size-3" /> Shown once.
            </p>
          </div>
        ) : (
          <form id="api-key-form" className="flex flex-col gap-4" onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
            <Field data-invalid={!!err.name}>
              <FieldLabel htmlFor="key-name">Name</FieldLabel>
              <Input id="key-name" placeholder="devfolio daily cron" {...form.register("name")} />
              <FieldError errors={[err.name]} />
            </Field>
            <Field data-invalid={!!err.source}>
              <FieldLabel htmlFor="key-source">Source</FieldLabel>
              <Input id="key-source" placeholder="devfolio" {...form.register("source")} />
              <FieldError errors={[err.source]} />
            </Field>
          </form>
        )}
        <DialogFooter>
          {token ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <Button type="submit" form="api-key-form" disabled={mutation.isPending}>
              Create
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
