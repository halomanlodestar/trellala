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


export type GanttTask = {
  id: string;
  text: string;
  type: "summary" | "task" | "milestone";
  start: Date;
  end?: Date;
  progress?: number;
  parent?: string;
  open?: boolean;
  hackathonId: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  url: string;
  hard: boolean;
  type: import("@trellala/core/types").HackathonType;
};
