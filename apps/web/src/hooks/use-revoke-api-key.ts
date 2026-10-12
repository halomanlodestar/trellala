"use client";

import { revokeApiKeyAction } from "@/server/actions/settings";
import { useActionMutation } from "./use-action-mutation";

export const useRevokeApiKey = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(revokeApiKeyAction, { success: "Revoked", ...opts });
