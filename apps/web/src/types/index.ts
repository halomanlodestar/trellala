import type { QueueGroupKey } from "@trellala/core/types";

export type ActionError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export type NavItem = { href: string; label: string; icon: import("lucide-react").LucideIcon; exact?: boolean };

export type QueueGroupMeta = Record<QueueGroupKey, { label: string; tone: "danger" | "warn" | "default" | "muted" }>;

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export type GanttRange = { start: Date; end: Date; days: number };
