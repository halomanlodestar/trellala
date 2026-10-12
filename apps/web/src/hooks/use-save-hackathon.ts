"use client";

import { useRouter } from "next/navigation";
import { createHackathonAction, updateHackathonAction } from "@/server/actions/hackathons";
import { useActionMutation } from "./use-action-mutation";

type Input = { hackathonId?: string; data: unknown };

/** Creates or updates a hackathon, then opens its page. */
export function useSaveHackathon(onFieldErrors: (fields: Record<string, string[]>) => void) {
  const router = useRouter();
  return useActionMutation(
    ({ hackathonId, data }: Input) => (hackathonId ? updateHackathonAction({ hackathonId, data }) : createHackathonAction(data)),
    {
      success: "Saved",
      refresh: false,
      onSuccess: ({ id }) => router.push(`/hackathons/${id}`),
      onError: (e) => {
        if (e.fields) onFieldErrors(e.fields);
      },
    },
  );
}
