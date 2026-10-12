import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, format, formatDistanceStrict } from "date-fns";

export const IST = "Asia/Kolkata";

const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

/** Parses a value as a Date; strings without an offset are read as IST. */
export function parseIstAware(value: unknown): unknown {
  if (typeof value === "string" && NAIVE_DATETIME.test(value)) {
    const [d, t] = value.split("T") as [string, string];
    const [y, mo, da] = d.split("-").map(Number) as [number, number, number];
    const [h, mi, s = 0] = t.split(":").map(Number) as [number, number, number?];
    return new Date(new TZDate(y, mo - 1, da, h, mi, s, IST).getTime());
  }
  return value;
}

/** "2026-10-20T18:00" in IST, for <input type="datetime-local">. */
export function toIstInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  return format(new TZDate(new Date(date).getTime(), IST), "yyyy-MM-dd'T'HH:mm");
}

export function formatIst(date: Date | string, pattern = "d MMM yyyy, HH:mm"): string {
  return format(new TZDate(new Date(date).getTime(), IST), pattern);
}

export function formatIstShort(date: Date | string): string {
  return formatIst(date, "d MMM, HH:mm");
}

/** "in 3 days" / "2 hours ago". */
export function relativeTime(date: Date | string, now: Date = new Date()): string {
  return formatDistanceStrict(new Date(date), now, { addSuffix: true });
}

/** Calendar days between now and date, counted in IST. */
export function istDayDiff(date: Date | string, now: Date = new Date()): number {
  return differenceInCalendarDays(new TZDate(new Date(date).getTime(), IST), new TZDate(now.getTime(), IST));
}

export function startOfIstDay(now: Date = new Date()): Date {
  const z = new TZDate(now.getTime(), IST);
  return new Date(new TZDate(z.getFullYear(), z.getMonth(), z.getDate(), IST).getTime());
}

export function addIstDays(date: Date, days: number): Date {
  return new Date(addDays(new TZDate(date.getTime(), IST), days).getTime());
}
