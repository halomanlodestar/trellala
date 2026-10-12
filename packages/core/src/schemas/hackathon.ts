/** @format */

import { z } from "zod";
import {
  HACKATHON_MODES,
  HACKATHON_STAGES,
  HACKATHON_TYPES,
  MANUAL_ARCHIVE_REASONS,
  MILESTONE_KINDS,
  PRIZE_KINDS,
} from "../constants/enums";
import {
  dateSchema,
  idSchema,
  nullableInt,
  nullableNumber,
  optionalText,
  optionalUrl,
  tagsSchema,
} from "./common";

export const milestoneFormSchema = z
  .object({
    id: idSchema.optional(),
    key: z.string().max(80).optional(),
    kind: z.enum(MILESTONE_KINDS),
    title: z.string().trim().min(1).max(200),
    action: optionalText(4000),
    startsAt: dateSchema.nullish().transform((v) => v ?? null),
    endsAt: dateSchema,
    sourceTimezone: optionalText(64),
    requiresAction: z.boolean(),
    isHardDeadline: z.boolean(),
  })
  .refine((m) => !m.startsAt || m.startsAt <= m.endsAt, {
    message: "Start is after end",
    path: ["startsAt"],
  });

export const prizeFormSchema = z.object({
  id: idSchema.optional(),
  key: z.string().max(80).optional(),
  title: z.string().trim().min(1).max(200),
  kind: z.enum(PRIZE_KINDS),
  amount: nullableNumber(0),
  currency: optionalText(16).transform((v) => (v ? v.toUpperCase() : null)),
  description: optionalText(2000),
  estimatedUsd: nullableNumber(0),
});

export const hackathonFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalText(20000),
  type: z.enum(HACKATHON_TYPES),
  mode: z.enum(HACKATHON_MODES),
  location: optionalText(200),
  stage: z.enum(HACKATHON_STAGES),
  sourceUrl: optionalUrl,
  teamSizeMin: nullableInt(1, 100),
  teamSizeMax: nullableInt(1, 100),
  eligibility: optionalText(4000),
  estimatedUsd: nullableNumber(0),
  effortEstimate: nullableInt(0, 10000),
  fitScore: nullableInt(1, 5),
  tags: tagsSchema,
  notes: optionalText(20000),
});

/** Create and edit share one shape: fields + full milestone and prize lists. */
export const hackathonFormSchema = hackathonFieldsSchema
  .extend({
    milestones: z.array(milestoneFormSchema).max(50),
    prizes: z.array(prizeFormSchema).max(100),
  })
  .refine(
    (h) =>
      h.teamSizeMin == null ||
      h.teamSizeMax == null ||
      h.teamSizeMin <= h.teamSizeMax,
    {
      message: "Min is above max",
      path: ["teamSizeMax"],
    },
  );

export const setStageSchema = z.object({
  hackathonId: idSchema,
  stage: z.enum(HACKATHON_STAGES),
});

export const archiveSchema = z.object({
  hackathonId: idSchema,
  reason: z.enum(MANUAL_ARCHIVE_REASONS),
  note: optionalText(1000),
});

export const hackathonIdSchema = z.object({ hackathonId: idSchema });

export const hackathonListFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  type: z.enum(HACKATHON_TYPES).optional(),
  mode: z.enum(HACKATHON_MODES).optional(),
  stage: z.enum(HACKATHON_STAGES).optional(),
  tag: z.string().trim().toLowerCase().max(40).optional(),
  member: idSchema.optional(),
  sort: z.enum(["deadline", "priority", "prize", "added"]).default("deadline"),
});
