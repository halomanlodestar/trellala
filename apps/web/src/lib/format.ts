import { formatIst } from "./time";

export function formatUsd(n: number | null): string | null {
  if (n === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: n >= 100_000 ? "compact" : "standard",
  }).format(n);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const sourceLabel = (source: string | null | undefined) => {
  if (!source) return "—";
  if (source.startsWith("user:")) return "manual edit";
  if (source.startsWith("ingest:")) return source.slice("ingest:".length);
  return source;
};

export const fieldLabel = (path: string) =>
  path.replace(/^milestones\./, "milestone ").replace(/^prizes\./, "prize ").replaceAll(".", " › ");

export const displayValue = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v) ? `${formatIst(v)} IST` : v;
  if (Array.isArray(v)) return v.join(", ") || "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return typeof v === "number" ? String(v) : JSON.stringify(v);
};
