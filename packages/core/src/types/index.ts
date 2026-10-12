import type { z } from "zod";
import type {
  hackathonFormSchema,
  hackathonListFilterSchema,
  ingestHackathonSchema,
  milestoneFormSchema,
  prizeFormSchema,
} from "../schemas";

export * from "./enums";
export * from "./views";

export type Actor =
  | { type: "USER"; userId: string }
  | { type: "API_KEY"; apiKeyId: string; source: string }
  | { type: "SYSTEM" };

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

/** "name" | "milestones.<key>.<field>" | "prizes.<key>.<field>" → normalized value. */
export type FlatValues = Record<string, JsonValue>;
/** "<fieldPath>" → source ("user:<id>" | "ingest:<source>"). */
export type FieldSources = Record<string, string>;

export type ParsedPath =
  | { entity: "hackathon"; field: string }
  | { entity: "milestone"; key: string; field: string }
  | { entity: "prize"; key: string; field: string };

export type FieldDecision =
  | { path: string; outcome: "unchanged" }
  | { path: string; outcome: "applied"; value: JsonValue }
  | { path: string; outcome: "added"; value: JsonValue }
  | { path: string; outcome: "conflict"; value: JsonValue; currentValue: JsonValue | undefined; currentSource: string | undefined; existingConflict: boolean };

export type MilestoneTemplate = {
  key: string;
  kind: import("./enums").MilestoneKind;
  title: string;
  requiresAction: boolean;
  isHardDeadline: boolean;
};

export type HackathonFormInput = z.input<typeof hackathonFormSchema>;
export type HackathonFormData = z.output<typeof hackathonFormSchema>;
export type MilestoneFormData = z.output<typeof milestoneFormSchema>;
export type PrizeFormData = z.output<typeof prizeFormSchema>;
export type HackathonListFilter = z.output<typeof hackathonListFilterSchema>;
export type IngestHackathon = z.output<typeof ingestHackathonSchema>;
