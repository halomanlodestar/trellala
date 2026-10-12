"use client";

import { deleteTeamMilestoneAction } from "@/server/actions/teams";
import { useActionMutation } from "./use-action-mutation";

export const useDeleteTeamMilestone = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(deleteTeamMilestoneAction, opts);
