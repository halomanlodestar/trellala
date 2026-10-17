"use client";

import type { HackathonFormInput } from "@trellala/core/types";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LinkFields() {
  const { control, register, formState } = useFormContext<HackathonFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "importantLinks", keyName: "_key" });
  const errors = formState.errors.importantLinks;

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <FieldLegend>Links</FieldLegend>
        <Button type="button" size="sm" variant="outline" onClick={() => append({ label: "", url: "" })}>
          <Plus /> Add
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {fields.map((f, i) => {
          const e = errors?.[i];
          return (
            <div key={f._key} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              <Field data-invalid={!!e?.label}>
                <Input placeholder="PPT template" aria-label="Label" aria-invalid={!!e?.label} {...register(`importantLinks.${i}.label`)} />
                <FieldError errors={[e?.label]} />
              </Field>
              <Field data-invalid={!!e?.url}>
                <Input type="url" placeholder="https://" aria-label="URL" aria-invalid={!!e?.url} {...register(`importantLinks.${i}.url`)} />
                <FieldError errors={[e?.url]} />
              </Field>
              <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(i)}>
                <Trash2 />
              </Button>
            </div>
          );
        })}
      </div>
    </FieldSet>
  );
}
