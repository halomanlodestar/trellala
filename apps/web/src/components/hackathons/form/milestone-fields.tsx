"use client";

import { MILESTONE_KIND_LABEL } from "@trellala/core/constants";
import type { HackathonFormInput, HackathonType } from "@trellala/core/types";
import { LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { templateMilestones, textInput } from "@/lib/form";
import { EnumSelect } from "./enum-select";

export function MilestoneFields() {
  const { control, register, getValues, formState } = useFormContext<HackathonFormInput>();
  const { fields, append, remove, replace } = useFieldArray({ control, name: "milestones", keyName: "_key" });
  const errors = formState.errors.milestones;

  const loadTemplate = () => {
    const type = getValues("type") as HackathonType;
    if (fields.length && !confirm("Replace the current timeline with the template?")) return;
    replace(templateMilestones(type));
  };

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>Timeline (IST)</FieldLegend>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="sm" variant="ghost" onClick={loadTemplate}>
                <LayoutTemplate /> Template
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use the template for this type</TooltipContent>
          </Tooltip>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              append({ kind: "CUSTOM", title: "", action: null, startsAt: null, endsAt: "", sourceTimezone: null, requiresAction: true, isHardDeadline: true })
            }
          >
            <Plus /> Add
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const e = errors?.[i];
          return (
            <div key={f._key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
              <Field className="sm:col-span-4" data-invalid={!!e?.title}>
                <FieldLabel htmlFor={`m-${i}-title`}>Title</FieldLabel>
                <Input id={`m-${i}-title`} {...register(`milestones.${i}.title`)} />
                <FieldError errors={[e?.title]} />
              </Field>
              <Field className="sm:col-span-3">
                <FieldLabel>Kind</FieldLabel>
                <EnumSelect name={`milestones.${i}.kind`} options={MILESTONE_KIND_LABEL} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`m-${i}-start`}>Start</FieldLabel>
                <Input id={`m-${i}-start`} type="datetime-local" {...register(`milestones.${i}.startsAt`, textInput)} />
              </Field>
              <Field className="sm:col-span-3" data-invalid={!!e?.endsAt}>
                <FieldLabel htmlFor={`m-${i}-end`}>Deadline</FieldLabel>
                <Input id={`m-${i}-end`} type="datetime-local" {...register(`milestones.${i}.endsAt`)} />
                <FieldError errors={[e?.endsAt ? { message: "Required" } : undefined]} />
              </Field>
              <Field className="sm:col-span-7">
                <FieldLabel htmlFor={`m-${i}-action`}>Action</FieldLabel>
                <Input id={`m-${i}-action`} placeholder="What needs to be done" {...register(`milestones.${i}.action`, textInput)} />
              </Field>
              <div className="flex items-end gap-4 sm:col-span-5">
                <Controller
                  control={control}
                  name={`milestones.${i}.requiresAction`}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={field.value} onCheckedChange={field.onChange} /> Action
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name={`milestones.${i}.isHardDeadline`}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={field.value} onCheckedChange={field.onChange} /> Hard
                    </label>
                  )}
                />
                <Button type="button" size="icon" variant="ghost" className="ml-auto" aria-label="Remove" onClick={() => remove(i)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </FieldSet>
  );
}
