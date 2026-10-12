"use client";

import { unarchiveHackathonAction } from "@/server/actions/hackathons";
import { useActionMutation } from "./use-action-mutation";

export const useUnarchiveHackathon = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(unarchiveHackathonAction, { success: "Restored", ...opts });
