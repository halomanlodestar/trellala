"use client";

import { discardIngestEventAction } from "@/server/actions/review";
import { useActionMutation } from "./use-action-mutation";
import { queryKeys } from "@/lib/query-keys";

export const useDiscardIngest = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(discardIngestEventAction, { success: "Discarded", invalidate: [queryKeys.reviewCounts], ...opts });
