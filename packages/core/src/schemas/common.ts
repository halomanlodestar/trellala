/** @format */

import { z } from "zod";
import { parseIstAware } from "../time";

export const idSchema = z.string().min(1).max(64);

/** Trimmed text; empty string becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const optionalUrl = z
  .union([z.literal(""), z.url({ protocol: /^https?$/ }).max(2048)])
  .nullish()
  .transform((v) => (v ? v : null));

export const tagsSchema = z
  .array(z.string().trim().toLowerCase().min(1).max(40))
  .max(30)
  .transform((tags) => [...new Set(tags)]);

/** Accepts a Date, an ISO string with offset, or "yyyy-MM-ddTHH:mm" read as IST. */
export const dateSchema = z.preprocess(parseIstAware, z.coerce.date());

export const nullableInt = (min: number, max: number) =>
  z
    .int()
    .min(min)
    .max(max)
    .nullish()
    .transform((v) => v ?? null);

export const nullableNumber = (min: number) =>
  z
    .number()
    .min(min)
    .finite()
    .nullish()
    .transform((v) => v ?? null);
