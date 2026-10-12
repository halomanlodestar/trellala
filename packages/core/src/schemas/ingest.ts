import { z } from "zod";
import { HACKATHON_MODES, HACKATHON_TYPES, MILESTONE_KINDS, PRIZE_KINDS } from "../constants/enums";
import { dateSchema } from "./common";

// Ingest payloads: omitted fields are left alone; explicit null clears a value.

const text = (max: number) => z.string().trim().max(max).nullable().optional();

export const ingestMilestoneSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, digits, _ or -")
    .optional(),
  kind: z.enum(MILESTONE_KINDS),
  title: z.string().trim().min(1).max(200),
  action: text(4000),
  startsAt: dateSchema.nullable().optional(),
  endsAt: dateSchema,
  sourceTimezone: text(64),
  requiresAction: z.boolean().optional(),
  isHardDeadline: z.boolean().optional(),
});

export const ingestPrizeSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  title: z.string().trim().min(1).max(200),
  kind: z.enum(PRIZE_KINDS),
  amount: z.number().nonnegative().finite().nullable().optional(),
  currency: text(16),
  description: text(2000),
  estimatedUsd: z.number().nonnegative().finite().nullable().optional(),
});

export const ingestHackathonObject = z.object({
  externalId: z.string().trim().min(1).max(200).optional(),
  sourceUrl: z.url({ protocol: /^https?$/ }).max(2048).optional(),
  name: z.string().trim().min(1).max(200),
  description: text(20000),
  type: z.enum(HACKATHON_TYPES).optional(),
  mode: z.enum(HACKATHON_MODES).optional(),
  location: text(200),
  teamSizeMin: z.int().min(1).max(100).nullable().optional(),
  teamSizeMax: z.int().min(1).max(100).nullable().optional(),
  eligibility: text(4000),
  estimatedUsd: z.number().nonnegative().finite().nullable().optional(),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30).optional(),
  milestones: z.array(ingestMilestoneSchema).max(50).optional(),
  prizes: z.array(ingestPrizeSchema).max(100).optional(),
});

export const ingestHackathonSchema = ingestHackathonObject.refine((h) => h.externalId || h.sourceUrl, {
  message: "externalId or sourceUrl is required",
  path: ["externalId"],
});

export const MAX_INGEST_BATCH = 100;

/** Items are validated one by one so a bad item doesn't reject the batch. */
export const ingestBatchSchema = z.object({
  hackathons: z.array(z.unknown()).min(1).max(MAX_INGEST_BATCH),
});

export const ingestJobSchema = z.object({ eventId: z.string().min(1) });

export const ingestEventIdSchema = z.object({ eventId: z.string().min(1).max(64) });

export const hackathonLookupSchema = z
  .object({
    externalId: z.string().trim().min(1).max(200).optional(),
    sourceUrl: z.url().max(2048).optional(),
  })
  .refine((q) => q.externalId || q.sourceUrl, { message: "externalId or sourceUrl is required" });
