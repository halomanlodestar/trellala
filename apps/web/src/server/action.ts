import "server-only";
import { isCoreError } from "@trellala/core";
import type { Actor, SessionUser } from "@trellala/core/types";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { getSessionUser, userActor } from "./auth";

type Ctx = { user: SessionUser; actor: Actor & { type: "USER" } };

/** Wraps a server action: session check → zod parse → core call → ActionResult. Never throws expected errors. */
export async function runAction<S extends z.ZodType, T>(
  schema: S,
  input: unknown,
  fn: (data: z.output<S>, ctx: Ctx) => Promise<T>,
): Promise<ActionResult<T>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: { code: "unauthorized", message: "Sign in again" } };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      error: {
        code: "validation_failed",
        message: flat.formErrors[0] ?? "Check the highlighted fields",
        fields: flat.fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    return { ok: true, data: await fn(parsed.data, { user, actor: userActor(user) }) };
  } catch (e) {
    unstable_rethrow(e);
    if (isCoreError(e)) return { ok: false, error: { code: e.code, message: e.message } };
    console.error("[action]", e);
    return { ok: false, error: { code: "internal", message: "Something went wrong" } };
  }
}
