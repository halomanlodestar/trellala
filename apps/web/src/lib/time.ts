// The only place UI code formats times. Everything is shown in IST.
export { formatIst, formatIstShort, relativeTime, toIstInput, istDayDiff } from "@trellala/core/time";

/** Compact signed countdown: "45m", "5h 40m", "2d 4h", "−3h 12m" once past. */
export function countdown(at: Date, now: Date): string {
  const diff = at.getTime() - now.getTime();
  const mins = Math.floor(Math.abs(diff) / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const body = d >= 7 ? `${d}d` : d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  return diff < 0 ? `−${body}` : body;
}
