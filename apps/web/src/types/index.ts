import type { QueueGroupKey } from "@trellala/core/types";

export type ActionError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export type NavItem = { href: string; label: string; icon: import("lucide-react").LucideIcon; exact?: boolean; badge?: "review" };

export type Tone = "late" | "soon" | "plain" | "faint";

export type QueueGroupMeta = Record<QueueGroupKey, { label: string; tone: Tone }>;

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;


export type TimelineParams = import("zod").infer<typeof import("@/schemas/timeline").timelineParamsSchema>;

export type TimelineZoom = TimelineParams["zoom"];

export type TimelineLayer = "phases" | "info" | "labels" | "teams" | "load" | "weekends";

export type TimelineLayers = Record<TimelineLayer, boolean>;

/** Visible range, as IST midnights; `days` holds one entry per day from `start` up to `end`. */
export type TimelineWindow = { start: Date; end: Date; days: Date[] };

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  url: string;
  hard: boolean;
  type: import("@trellala/core/types").HackathonType;
};
