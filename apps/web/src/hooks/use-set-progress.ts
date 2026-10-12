"use client";

import { setProgressAction } from "@/server/actions/teams";
import { useActionMutation } from "./use-action-mutation";

export const useSetProgress = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(setProgressAction, opts);
