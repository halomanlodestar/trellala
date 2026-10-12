import type { FlatValues, JsonValue, ParsedPath } from "../types";

// Fields tracked for provenance and diffed on ingest. User-only fields
// (stage, effortEstimate, fitScore, notes) are never touched by ingest.
export const HACKATHON_FIELDS = [
  "name",
  "description",
  "type",
  "mode",
  "location",
  "sourceUrl",
  "teamSizeMin",
  "teamSizeMax",
  "eligibility",
  "estimatedUsd",
  "tags",
] as const;

export const MILESTONE_FIELDS = [
  "kind",
  "title",
  "action",
  "startsAt",
  "endsAt",
  "sourceTimezone",
  "requiresAction",
  "isHardDeadline",
] as const;

export const PRIZE_FIELDS = ["title", "kind", "amount", "currency", "description", "estimatedUsd"] as const;

export type HackathonField = (typeof HACKATHON_FIELDS)[number];
export type MilestoneField = (typeof MILESTONE_FIELDS)[number];
export type PrizeField = (typeof PRIZE_FIELDS)[number];

/** Makes a value comparable and JSON-safe. Returns undefined for "not provided". */
export function normalizeValue(value: unknown): JsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toNumber" in value && typeof value.toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  if (Array.isArray(value)) return [...value].map((v) => normalizeValue(v) ?? null).sort() as JsonValue;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function valuesEqual(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

type Keyed = { key: string } & Record<string, unknown>;

export type AggregateShape = Record<string, unknown> & {
  milestones?: Keyed[];
  prizes?: Keyed[];
};

/** Flattens a hackathon aggregate into field paths. Omitted values are skipped. */
export function flatten(agg: AggregateShape): FlatValues {
  const out: FlatValues = {};
  for (const f of HACKATHON_FIELDS) {
    const v = normalizeValue(agg[f]);
    if (v !== undefined) out[f] = v;
  }
  for (const m of agg.milestones ?? []) {
    for (const f of MILESTONE_FIELDS) {
      const v = normalizeValue(m[f]);
      if (v !== undefined) out[`milestones.${m.key}.${f}`] = v;
    }
  }
  for (const p of agg.prizes ?? []) {
    for (const f of PRIZE_FIELDS) {
      const v = normalizeValue(p[f]);
      if (v !== undefined) out[`prizes.${p.key}.${f}`] = v;
    }
  }
  return out;
}

export function parsePath(path: string): ParsedPath | null {
  const parts = path.split(".");
  if (parts.length === 1) {
    return (HACKATHON_FIELDS as readonly string[]).includes(path) ? { entity: "hackathon", field: path } : null;
  }
  if (parts.length === 3) {
    const [group, key, field] = parts as [string, string, string];
    if (group === "milestones" && (MILESTONE_FIELDS as readonly string[]).includes(field)) return { entity: "milestone", key, field };
    if (group === "prizes" && (PRIZE_FIELDS as readonly string[]).includes(field)) return { entity: "prize", key, field };
  }
  return null;
}

/** Paths whose value differs between two flattened snapshots (including removed ones). */
export function changedPaths(before: FlatValues, after: FlatValues): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => !valuesEqual(before[k], after[k]));
}

/** Converts a normalized value back into what Prisma expects for that field. */
export function denormalize(field: string, value: JsonValue): unknown {
  if (value === null) return null;
  if (field === "startsAt" || field === "endsAt") return new Date(value as string);
  return value;
}

export function slugKey(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "item"
  );
}

/** Returns a key not present in `taken`, suffixing _2, _3… if needed. */
export function uniqueKey(base: string, taken: Set<string>): string {
  let key = base;
  for (let i = 2; taken.has(key); i++) key = `${base}_${i}`;
  taken.add(key);
  return key;
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname.replace(/^www\./, "")}${path}`.toLowerCase();
  } catch {
    return null;
  }
}
