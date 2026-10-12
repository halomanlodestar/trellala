import { z } from "zod";
import { ACTOR_TYPES, MANUAL_ARCHIVE_REASONS, AUTO_ARCHIVE_REASONS } from "../constants/enums";
import { idSchema, tagsSchema } from "./common";

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  skills: tagsSchema,
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  source: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, digits, _ or -"),
});

export const apiKeyIdSchema = z.object({ apiKeyId: idSchema });

export const resolveConflictSchema = z.discriminatedUnion("choice", [
  z.object({ conflictId: idSchema, choice: z.literal("current"), note: z.string().max(1000).optional() }),
  z.object({ conflictId: idSchema, choice: z.literal("candidate"), candidateId: idSchema, note: z.string().max(1000).optional() }),
  z.object({ conflictId: idSchema, choice: z.literal("custom"), value: z.unknown(), note: z.string().max(1000).optional() }),
]);

export const ingestEventActionSchema = z.object({ eventId: idSchema });

export const activityFilterSchema = z.object({
  actorType: z.enum(ACTOR_TYPES).optional(),
  actorUserId: idSchema.optional(),
  actorApiKeyId: idSchema.optional(),
  action: z.string().max(80).optional(),
  hackathonId: idSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cursor: idSchema.optional(),
});

export const archiveFilterSchema = z.object({
  reason: z.enum([...MANUAL_ARCHIVE_REASONS, ...AUTO_ARCHIVE_REASONS]).optional(),
});

export const queueFilterSchema = z.object({
  tag: z.string().trim().toLowerCase().max(40).optional(),
  mine: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
