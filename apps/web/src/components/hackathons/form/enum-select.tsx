"use client";

import type { HackathonFormInput } from "@trellala/core/types";
import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { name: FieldPath<HackathonFormInput>; options: Record<string, string>; className?: string };

/** Select bound to a form field holding one enum value. */
export function EnumSelect({ name, options, className }: Props) {
  const { control } = useFormContext<HackathonFormInput>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
          <SelectTrigger className={className ?? "w-full"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(options).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
