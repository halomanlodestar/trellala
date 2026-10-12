"use client";

import { retryIngestEventAction } from "@/server/actions/review";
import { useActionMutation } from "./use-action-mutation";
import { queryKeys } from "@/lib/query-keys";

export const useRetryIngest = (opts?: Parameters<typeof useActionMutation>[1]) => useActionMutation(retryIngestEventAction, { success: "Queued", invalidate: [queryKeys.reviewCounts], ...opts });
