"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema } from "@trellala/core/schemas";
import type { PersonView } from "@trellala/core/types";
import { Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { TagInput } from "@/components/common/tag-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import type { ProfileFormData, ProfileFormInput } from "@/types/forms";

type Props = { profile: PersonView; suggestions: string[] };

export function ProfileForm({ profile, suggestions }: Props) {
  const form = useForm<ProfileFormInput, unknown, ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, skills: profile.skills },
  });
  const mutation = useUpdateProfile();
  const err = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="flex max-w-md flex-col gap-4">
      <Field data-invalid={!!err.name}>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input id="name" {...form.register("name")} />
        <FieldError errors={[err.name]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="skills">Skills</FieldLabel>
        <Controller
          control={form.control}
          name="skills"
          render={({ field }) => <TagInput id="skills" value={field.value} onChange={field.onChange} suggestions={suggestions} placeholder="frontend, ml, pwn…" />}
        />
      </Field>
      <Button type="submit" className="self-start" disabled={mutation.isPending}>
        <Save /> Save
      </Button>
    </form>
  );
}
