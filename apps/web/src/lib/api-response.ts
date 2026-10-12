import { CoreError, isCoreError, type CoreErrorCode } from "@trellala/core";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";

const STATUS: Record<CoreErrorCode, number> = {
  validation_failed: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  payload_too_large: 413,
};

export const ok = <T>(data: T, status = 200) => NextResponse.json(data, { status });

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, { status });
}

export const zodError = (error: z.ZodError) => apiError(400, "validation_failed", "Invalid request", z.flattenError(error));

/** Maps any thrown value to a JSON error response; unknown errors become a generic 500. */
export function handleApiError(e: unknown) {
  unstable_rethrow(e);
  if (isCoreError(e)) return apiError(STATUS[e.code], e.code, e.message, e.details);
  if (e instanceof z.ZodError) return zodError(e);
  console.error("[api]", e);
  return apiError(500, "internal", "Internal server error");
}

/** Parses a JSON body, rejecting malformed JSON (400) and bodies over `maxBytes` (413). */
export async function readJson(req: Request, maxBytes = 2_000_000): Promise<unknown> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > maxBytes) throw new CoreError("payload_too_large", `Body exceeds ${maxBytes} bytes`);
  const text = await req.text();
  if (text.length > maxBytes) throw new CoreError("payload_too_large", `Body exceeds ${maxBytes} bytes`);
  try {
    return JSON.parse(text);
  } catch {
    throw new CoreError("validation_failed", "Malformed JSON");
  }
}

export const bearerToken = (req: Request) => req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? null;
