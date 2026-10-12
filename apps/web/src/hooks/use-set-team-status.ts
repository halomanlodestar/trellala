"use client";

import { setTeamStatusAction } from "@/server/actions/teams";
import { useActionMutation } from "./use-action-mutation";

export const useSetTeamStatus = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(setTeamStatusAction, opts);
