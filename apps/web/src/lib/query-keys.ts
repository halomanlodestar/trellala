export const queryKeys = {
  reviewCounts: ["review-counts"] as const,
  searchIndex: ["search-index"] as const,
  activity: (filters: Record<string, string | undefined>) => ["activity", filters] as const,
};
