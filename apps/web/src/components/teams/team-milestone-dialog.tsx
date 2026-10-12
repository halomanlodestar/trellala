"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { teamMilestoneFormSchema } from "@trellala/core/schemas";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateTeamMilestone } from "@/hooks/use-create-team-milestone";
import { textInput } from "@/lib/form";
import type { TeamMilestoneFormInput, TeamMilestoneFormData } from "@/types/forms";

type Props = { teamId: string };

export function TeamMilestoneDialog({ teamId }: Props) {
  const [open, setOpen] = useState(false);
  const form = useForm<TeamMilestoneFormInput, unknown, TeamMilestoneFormData>({
    resolver: zodResolver(teamMilestoneFormSchema),
    defaultValues: { title: "", action: null, endsAt: "" },
  });
  const mutation = useCreateTeamMilestone({
    success: "Added",
    onSuccess: () => {
      form.reset();
      setOpen(false);
    },
  });
  const err = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Plus /> Team milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Team milestone</DialogTitle>
        </DialogHeader>
        <form id={`tm-${teamId}`} className="flex flex-col gap-4" onSubmit={form.handleSubmit((data) => mutation.mutate({ ...data, teamId }))}>
          <Field data-invalid={!!err.title}>
            <FieldLabel htmlFor="tm-title">Title</FieldLabel>
            <Input id="tm-title" {...form.register("title")} />
            <FieldError errors={[err.title]} />
          </Field>
          <Field data-invalid={!!err.endsAt}>
            <FieldLabel htmlFor="tm-end">Due (IST)</FieldLabel>
            <Input id="tm-end" type="datetime-local" {...form.register("endsAt")} />
            <FieldError errors={[err.endsAt ? { message: "Required" } : undefined]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tm-action">Action</FieldLabel>
            <Input id="tm-action" {...form.register("action", textInput)} />
          </Field>
        </form>
        <DialogFooter>
          <Button type="submit" form={`tm-${teamId}`} disabled={mutation.isPending}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
