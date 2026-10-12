"use client";

import { archiveHackathonAction } from "@/server/actions/hackathons";
import { useActionMutation } from "./use-action-mutation";

export const useArchiveHackathon = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(archiveHackathonAction, { success: "Archived", ...opts });
