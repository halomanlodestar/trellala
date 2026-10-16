import type { TeamMarkState, TimelineLane, TimelineRow } from "@trellala/core/types";
import type { CalendarEvent, TimelineLayer, TimelineLayers, TimelineWindow, TimelineZoom } from "@/types";
import { addIstDays, startOfIstDay } from "./time";

export const TIMELINE_ZOOMS: Record<TimelineZoom, { label: string; back: number; ahead: number }> = {
  "2w": { label: "2 weeks", back: 3, ahead: 14 },
  "6w": { label: "6 weeks", back: 7, ahead: 35 },
  "3m": { label: "3 months", back: 14, ahead: 76 },
};

export const TIMELINE_LAYERS: { key: TimelineLayer; label: string }[] = [
  { key: "phases", label: "Phases" },
  { key: "info", label: "Info milestones" },
  { key: "labels", label: "All labels" },
  { key: "teams", label: "Team rows" },
  { key: "load", label: "Deadline load" },
  { key: "weekends", label: "Weekends" },
];

/** Quiet by default: phases and action deadlines only, one label per lane. */
export const TIMELINE_LAYER_DEFAULTS: TimelineLayers = {
  phases: true,
  info: false,
  labels: false,
  teams: false,
  load: false,
  weekends: true,
};

export const TEAM_MARK_GLYPH: Record<TeamMarkState, string> = { done: "✓", skipped: "–", missed: "✗", late: "!", todo: "○" };

export const TEAM_MARK_TONE: Record<TeamMarkState, string> = {
  done: "text-done",
  skipped: "text-muted-foreground",
  missed: "text-destructive",
  late: "text-soon",
  todo: "text-muted-foreground",
};

export const TEAM_MARK_LABEL: Record<TeamMarkState, string> = { done: "done", skipped: "skipped", missed: "missed", late: "overdue", todo: "to do" };

export function timelineWindow(zoom: TimelineZoom, now: Date): TimelineWindow {
  const z = TIMELINE_ZOOMS[zoom];
  const start = addIstDays(startOfIstDay(now), -z.back);
  const days = Array.from({ length: z.back + z.ahead + 1 }, (_, i) => addIstDays(start, i));
  return { start, end: addIstDays(start, days.length), days };
}

/** Horizontal position of `d` in the window, as a percentage. */
export const position = (w: TimelineWindow, d: Date) => ((d.getTime() - w.start.getTime()) / (w.end.getTime() - w.start.getTime())) * 100;

export const inWindow = (w: TimelineWindow, d: Date) => d >= w.start && d <= w.end;

/** A span clipped to the window, as left/width percentages; null when it falls outside. */
export function clipSpan(w: TimelineWindow, start: Date, end: Date) {
  const a = Math.max(start.getTime(), w.start.getTime());
  const b = Math.min(end.getTime(), w.end.getTime());
  if (b <= a) return null;
  const left = position(w, new Date(a));
  return { left, width: position(w, new Date(b)) - left };
}

/** Hard deadlines per visible day, across every lane. */
export function hardDeadlinesPerDay(lanes: TimelineLane[], w: TimelineWindow): number[] {
  const counts = w.days.map(() => 0);
  for (const lane of lanes)
    for (const m of lane.marks) {
      if (m.kind !== "hard" || !inWindow(w, m.at)) continue;
      const i = w.days.findLastIndex((d) => d <= m.at);
      if (i >= 0) counts[i] = (counts[i] ?? 0) + 1;
    }
  return counts;
}

/** Calendar events: every event milestone, plus team-only milestones. */
export function toCalendarEvents(rows: TimelineRow[]): CalendarEvent[] {
  return rows.flatMap((r) => [
    ...r.milestones.map((m) => ({
      id: m.id,
      title: `${r.name} · ${m.title}`,
      start: m.endsAt,
      url: `/hackathons/${r.hackathonId}`,
      hard: m.requiresAction && m.isHardDeadline,
      type: r.type,
    })),
    ...r.teams.flatMap((t) =>
      t.milestones.map((m) => ({
        id: m.id,
        title: `${t.name} · ${m.title}`,
        start: m.endsAt,
        url: `/hackathons/${r.hackathonId}/teams/${t.id}`,
        hard: false,
        type: r.type,
      })),
    ),
  ]);
}
