"use client";

import { resolveConflictAction } from "@/server/actions/review";
import { useActionMutation } from "./use-action-mutation";
import { queryKeys } from "@/lib/query-keys";

export const useResolveConflict = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(resolveConflictAction, { success: "Resolved", invalidate: [queryKeys.reviewCounts], ...opts });
