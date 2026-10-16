"use client";

import type { SearchEntry } from "@trellala/core/types";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

/** Hackathon names for the command palette; only fetched once the palette opens. */
export function useSearchIndex(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.searchIndex,
    queryFn: async (): Promise<SearchEntry[]> => {
      const res = await fetch("/api/app/search");
      if (!res.ok) throw new Error("Failed to load search");
      return res.json();
    },
    enabled,
    staleTime: 60_000,
  });
}
