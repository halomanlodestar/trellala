"use client";

import { PRIZE_KIND_LABEL } from "@trellala/core/constants";
import type { HackathonFormInput } from "@trellala/core/types";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { numberInput, textInput } from "@/lib/form";
import { EnumSelect } from "./enum-select";

export function PrizeFields() {
  const { control, register, formState } = useFormContext<HackathonFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "prizes", keyName: "_key" });
  const errors = formState.errors.prizes;

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>Prizes</FieldLegend>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ title: "", kind: "CASH", amount: null, currency: "INR", description: null, estimatedUsd: null })}
        >
          <Plus /> Add
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => {
          const e = errors?.[i];
          return (
            <div key={f._key} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
              <Field className="sm:col-span-4" data-invalid={!!e?.title}>
                <FieldLabel htmlFor={`p-${i}-title`}>Title</FieldLabel>
                <Input id={`p-${i}-title`} placeholder="1st place" {...register(`prizes.${i}.title`)} />
                <FieldError errors={[e?.title]} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Kind</FieldLabel>
                <EnumSelect name={`prizes.${i}.kind`} options={PRIZE_KIND_LABEL} />
              </Field>
              <Field className="sm:col-span-2" data-invalid={!!e?.amount}>
                <FieldLabel htmlFor={`p-${i}-amount`}>Amount</FieldLabel>
                <Input id={`p-${i}-amount`} type="number" min={0} step="any" {...register(`prizes.${i}.amount`, numberInput)} />
              </Field>
              <Field className="sm:col-span-1">
                <FieldLabel htmlFor={`p-${i}-cur`}>Cur.</FieldLabel>
                <Input id={`p-${i}-cur`} placeholder="INR" {...register(`prizes.${i}.currency`, textInput)} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`p-${i}-usd`}>≈ USD</FieldLabel>
                <Input id={`p-${i}-usd`} type="number" min={0} step="any" {...register(`prizes.${i}.estimatedUsd`, numberInput)} />
              </Field>
              <div className="flex items-end sm:col-span-1">
                <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(i)}>
                  <Trash2 />
                </Button>
              </div>
              <Field className="sm:col-span-12">
                <Input placeholder="Details (track, perks…)" {...register(`prizes.${i}.description`, textInput)} />
              </Field>
            </div>
          );
        })}
      </div>
    </FieldSet>
  );
}
