"use client";

import { createTeamMilestoneAction } from "@/server/actions/teams";
import { useActionMutation } from "./use-action-mutation";

export const useCreateTeamMilestone = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(createTeamMilestoneAction, opts);
