"use client";

import { updateProfileAction } from "@/server/actions/settings";
import { useActionMutation } from "./use-action-mutation";

export const useUpdateProfile = () => useActionMutation(updateProfileAction, { success: "Saved" });
