import type { TimelineRow } from "@trellala/core/types";
import type { CalendarEvent, GanttTask } from "@/types";

const DAY = 864e5;

/** Gantt rows: hackathon (summary) → event milestones (diamonds) + team bars with progress. */
export function toGanttTasks(rows: TimelineRow[]): GanttTask[] {
  const tasks: GanttTask[] = [];
  for (const r of rows) {
    if (r.milestones.length === 0) continue;
    const start = Math.min(...r.milestones.map((m) => (m.startsAt ?? m.endsAt).getTime()));
    const end = Math.max(...r.milestones.map((m) => m.endsAt.getTime()));
    const hid = `h:${r.hackathonId}`;
    tasks.push({
      id: hid,
      text: r.name,
      type: "summary",
      start: new Date(start - DAY / 2),
      end: new Date(Math.max(end, start + DAY)),
      open: true,
      hackathonId: r.hackathonId,
    });
    for (const m of r.milestones) {
      tasks.push({ id: `m:${m.id}`, text: m.title, type: "milestone", start: m.endsAt, parent: hid, hackathonId: r.hackathonId });
    }
    for (const t of r.teams) {
      const actions = [...r.milestones.filter((m) => m.requiresAction), ...t.milestones];
      if (actions.length === 0) continue;
      const done = new Set(t.progress.filter((p) => p.state === "DONE").map((p) => p.milestoneId));
      const tEnd = Math.max(...actions.map((m) => m.endsAt.getTime()));
      tasks.push({
        id: `t:${t.id}`,
        text: `${t.name}${t.status === "MISSED" ? " · missed" : ""}`,
        type: "task",
        start: new Date(start),
        end: new Date(Math.max(tEnd, start + DAY)),
        progress: Math.round((actions.filter((m) => done.has(m.id)).length / actions.length) * 100),
        parent: hid,
        hackathonId: r.hackathonId,
      });
    }
  }
  return tasks;
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

/** Visible Gantt window: a week before today (or the first task) to a week past the last task. */
export function ganttRange(tasks: GanttTask[], now: Date) {
  const starts = tasks.map((t) => t.start.getTime());
  const ends = tasks.map((t) => (t.end ?? t.start).getTime());
  return {
    start: new Date(Math.min(now.getTime() - 7 * DAY, ...starts)),
    end: new Date(Math.max(now.getTime() + 30 * DAY, ...ends) + 7 * DAY),
  };
}
