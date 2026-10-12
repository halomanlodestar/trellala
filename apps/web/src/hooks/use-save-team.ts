"use client";

import { createTeamAction, updateTeamAction } from "@/server/actions/teams";
import { useActionMutation } from "./use-action-mutation";

type Input = ({ teamId: string } | { hackathonId: string }) & Record<string, unknown>;

export function useSaveTeam(onDone: () => void) {
  return useActionMutation((input: Input) => ("teamId" in input ? updateTeamAction(input) : createTeamAction(input)), {
    success: "Team saved",
    onSuccess: onDone,
  });
}
