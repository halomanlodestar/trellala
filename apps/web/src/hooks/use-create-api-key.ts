"use client";

import type { CreatedApiKey } from "@trellala/core/types";
import { createApiKeyAction } from "@/server/actions/settings";
import { useActionMutation } from "./use-action-mutation";

export const useCreateApiKey = (onCreated: (key: CreatedApiKey) => void) =>
  useActionMutation(createApiKeyAction, { onSuccess: onCreated });
