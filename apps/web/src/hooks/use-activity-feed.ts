"use client";

import type { ActivityPage } from "@trellala/core/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

const revive = (page: ActivityPage): ActivityPage => ({
  ...page,
  items: page.items.map((i) => ({ ...i, createdAt: new Date(i.createdAt) })),
});

export function useActivityFeed(filters: Record<string, string | undefined>, firstPage: ActivityPage) {
  return useInfiniteQuery({
    queryKey: queryKeys.activity(filters),
    queryFn: async ({ pageParam }): Promise<ActivityPage> => {
      const params = new URLSearchParams(Object.entries({ ...filters, cursor: pageParam }).filter((e): e is [string, string] => !!e[1]));
      const res = await fetch(`/api/app/activity?${params}`);
      if (!res.ok) throw new Error("Failed to load activity");
      return revive(await res.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: { pages: [firstPage], pageParams: [undefined] },
  });
}
