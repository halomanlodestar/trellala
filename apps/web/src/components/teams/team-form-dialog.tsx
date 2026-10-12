"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { teamFormSchema } from "@trellala/core/schemas";
import type { HackathonDetail, PersonView, TeamView } from "@trellala/core/types";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useSaveTeam } from "@/hooks/use-save-team";
import { textInput } from "@/lib/form";
import type { TeamFormData, TeamFormInput } from "@/types/forms";

type Props = {
  hackathon: Pick<HackathonDetail, "id" | "teamSizeMin" | "teamSizeMax" | "tags">;
  team?: TeamView;
  people: PersonView[];
  /** Users already on another team in this hackathon. */
  takenIds: string[];
};

export function TeamFormDialog({ hackathon, team, people, takenIds }: Props) {
  const [open, setOpen] = useState(false);
  const form = useForm<TeamFormInput, unknown, TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name ?? "",
      ideaTitle: team?.ideaTitle ?? null,
      ideaDescription: team?.ideaDescription ?? null,
      repoUrl: team?.repoUrl ?? null,
      demoUrl: team?.demoUrl ?? null,
      submissionUrl: team?.submissionUrl ?? null,
      memberIds: team?.members.map((m) => m.id) ?? [],
    },
  });
  const save = useSaveTeam(() => {
    setOpen(false);
    if (!team) form.reset();
  });
  const err = form.formState.errors;
  const memberIds = useWatch({ control: form.control, name: "memberIds" });
  const max = hackathon.teamSizeMax;

  const submit = form.handleSubmit((data) => save.mutate(team ? { ...data, teamId: team.id } : { ...data, hackathonId: hackathon.id }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {team ? (
          <Button size="icon" variant="ghost" className="size-8" aria-label="Edit team">
            <Pencil />
          </Button>
        ) : (
          <Button size="sm">
            <Plus /> Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team ? "Edit team" : "New team"}</DialogTitle>
        </DialogHeader>
        <form id={`team-${team?.id ?? "new"}`} onSubmit={submit} className="flex flex-col gap-4">
          <Field data-invalid={!!err.name}>
            <FieldLabel htmlFor="team-name">Name</FieldLabel>
            <Input id="team-name" {...form.register("name")} />
            <FieldError errors={[err.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="team-idea">Idea</FieldLabel>
            <Input id="team-idea" {...form.register("ideaTitle", textInput)} />
            <Textarea rows={2} placeholder="Details" {...form.register("ideaDescription", textInput)} />
          </Field>
          <Field>
            <FieldLabel>
              Members{" "}
              <span className="font-normal text-muted-foreground">
                {memberIds.length}
                {max ? ` / ${max}` : ""}
              </span>
            </FieldLabel>
            <Controller
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="flex flex-col p-1">
                    {people.map((p) => {
                      const taken = takenIds.includes(p.id) && !team?.members.some((m) => m.id === p.id);
                      const checked = field.value.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={taken}
                            onCheckedChange={(on) => field.onChange(on ? [...field.value, p.id] : field.value.filter((id) => id !== p.id))}
                          />
                          <span className="text-sm">{p.name}</span>
                          <span className="ml-auto flex flex-wrap justify-end gap-1">
                            {p.skills.map((s) => (
                              <span
                                key={s}
                                className={`rounded px-1 text-[10px] ${hackathon.tags.includes(s) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                              >
                                {s}
                              </span>
                            ))}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field data-invalid={!!err.repoUrl}>
              <FieldLabel htmlFor="team-repo">Repo</FieldLabel>
              <Input id="team-repo" type="url" {...form.register("repoUrl", textInput)} />
              <FieldError errors={[err.repoUrl]} />
            </Field>
            <Field data-invalid={!!err.demoUrl}>
              <FieldLabel htmlFor="team-demo">Demo</FieldLabel>
              <Input id="team-demo" type="url" {...form.register("demoUrl", textInput)} />
              <FieldError errors={[err.demoUrl]} />
            </Field>
            <Field data-invalid={!!err.submissionUrl}>
              <FieldLabel htmlFor="team-sub">Submission</FieldLabel>
              <Input id="team-sub" type="url" {...form.register("submissionUrl", textInput)} />
              <FieldError errors={[err.submissionUrl]} />
            </Field>
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form={`team-${team?.id ?? "new"}`} disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
