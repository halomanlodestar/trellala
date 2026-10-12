/** @format */

import { z } from "zod";

const baseSchema = z.object({
  DATABASE_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const webEnvSchema = baseSchema.extend({
  REDIS_URL: z.url(),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export const workerEnvSchema = baseSchema.extend({
  REDIS_URL: z.url(),
});

/** Parses env at startup and exits with a readable message if anything is missing. */
export function loadEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined> = process.env,
): z.output<T> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const lines = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.log(lines);
    // throw new Error(`Invalid environment:\n${lines}`);
    return process.exit(1);
  }

  return result.data;
}
