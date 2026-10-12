export const queryKeys = {
  reviewCounts: ["review-counts"] as const,
  activity: (filters: Record<string, string | undefined>) => ["activity", filters] as const,
};
