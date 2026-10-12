"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { HACKATHON_MODE_LABEL, HACKATHON_STAGE_LABEL, HACKATHON_TYPE_LABEL } from "@trellala/core/constants";
import { hackathonFormSchema } from "@trellala/core/schemas";
import type { HackathonFormData, HackathonFormInput } from "@trellala/core/types";
import { Save } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { TagInput } from "@/components/common/tag-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveHackathon } from "@/hooks/use-save-hackathon";
import { applyFieldErrors, numberInput, textInput } from "@/lib/form";
import { EnumSelect } from "./enum-select";
import { MilestoneFields } from "./milestone-fields";
import { PrizeFields } from "./prize-fields";

type Props = { hackathonId?: string; defaultValues: HackathonFormInput; tagSuggestions: string[] };

export function HackathonForm({ hackathonId, defaultValues, tagSuggestions }: Props) {
  const form = useForm<HackathonFormInput, unknown, HackathonFormData>({
    resolver: zodResolver(hackathonFormSchema),
    defaultValues,
  });
  const { register, control, formState, handleSubmit, setError } = form;
  const save = useSaveHackathon((fields) => applyFieldErrors(setError, fields));
  const err = formState.errors;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit((data) => save.mutate({ hackathonId, data }))} className="flex max-w-4xl flex-col gap-8">
        <FieldSet>
          <FieldLegend>Basics</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2" data-invalid={!!err.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" {...register("name")} aria-invalid={!!err.name} />
              <FieldError errors={[err.name]} />
            </Field>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <EnumSelect name="type" options={HACKATHON_TYPE_LABEL} />
            </Field>
            <Field>
              <FieldLabel>Mode</FieldLabel>
              <EnumSelect name="mode" options={HACKATHON_MODE_LABEL} />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input id="location" {...register("location", textInput)} />
            </Field>
            <Field>
              <FieldLabel>Stage</FieldLabel>
              <EnumSelect name="stage" options={HACKATHON_STAGE_LABEL} />
            </Field>
            <Field className="sm:col-span-2" data-invalid={!!err.sourceUrl}>
              <FieldLabel htmlFor="sourceUrl">Link</FieldLabel>
              <Input id="sourceUrl" type="url" placeholder="https://" {...register("sourceUrl", textInput)} />
              <FieldError errors={[err.sourceUrl]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="tags">Tags</FieldLabel>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => <TagInput id="tags" value={field.value} onChange={field.onChange} suggestions={tagSuggestions} />}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Requirements</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-4">
            <Field data-invalid={!!err.teamSizeMin}>
              <FieldLabel htmlFor="teamSizeMin">Min team</FieldLabel>
              <Input id="teamSizeMin" type="number" min={1} {...register("teamSizeMin", numberInput)} />
              <FieldError errors={[err.teamSizeMin]} />
            </Field>
            <Field data-invalid={!!err.teamSizeMax}>
              <FieldLabel htmlFor="teamSizeMax">Max team</FieldLabel>
              <Input id="teamSizeMax" type="number" min={1} {...register("teamSizeMax", numberInput)} />
              <FieldError errors={[err.teamSizeMax]} />
            </Field>
            <Field className="sm:col-span-4">
              <FieldLabel htmlFor="eligibility">Eligibility</FieldLabel>
              <Textarea id="eligibility" rows={2} {...register("eligibility", textInput)} />
            </Field>
          </FieldGroup>
        </FieldSet>

        <MilestoneFields />
        <PrizeFields />

        <FieldSet>
          <FieldLegend>Priority</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!err.estimatedUsd}>
              <FieldLabel htmlFor="estimatedUsd">Est. value (USD)</FieldLabel>
              <Input id="estimatedUsd" type="number" min={0} step="any" {...register("estimatedUsd", numberInput)} />
              <FieldError errors={[err.estimatedUsd]} />
            </Field>
            <Field data-invalid={!!err.effortEstimate}>
              <FieldLabel htmlFor="effortEstimate">Effort (hours)</FieldLabel>
              <Input id="effortEstimate" type="number" min={0} {...register("effortEstimate", numberInput)} />
              <FieldError errors={[err.effortEstimate]} />
            </Field>
            <Field data-invalid={!!err.fitScore}>
              <FieldLabel htmlFor="fitScore">Fit (1–5)</FieldLabel>
              <Input id="fitScore" type="number" min={1} max={5} {...register("fitScore", numberInput)} />
              <FieldError errors={[err.fitScore]} />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" rows={3} {...register("description", textInput)} />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" rows={3} {...register("notes", textInput)} />
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
          {err.root?.message && <p className="mr-auto text-sm text-destructive">{err.root.message}</p>}
          <Button type="submit" disabled={save.isPending}>
            <Save /> Save
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
