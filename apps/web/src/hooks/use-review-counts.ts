"use client";

import type { ReviewCounts } from "@trellala/core/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function useReviewCounts(initialData: ReviewCounts) {
  return useQuery({
    queryKey: queryKeys.reviewCounts,
    queryFn: async (): Promise<ReviewCounts> => {
      const res = await fetch("/api/app/review-counts");
      if (!res.ok) throw new Error("Failed to load review counts");
      return res.json();
    },
    initialData,
    refetchInterval: 60_000,
  });
}
