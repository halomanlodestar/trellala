"use client";

import { setStageAction } from "@/server/actions/hackathons";
import { useActionMutation } from "./use-action-mutation";

export const useSetStage = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(setStageAction, opts);
