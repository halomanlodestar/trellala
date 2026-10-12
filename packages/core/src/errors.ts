export type CoreErrorCode =
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large";

/** Expected failure raised by core; apps map `code` to an HTTP status or ActionResult. */
export class CoreError extends Error {
  readonly code: CoreErrorCode;
  readonly details?: unknown;

  constructor(code: CoreErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.details = details;
  }
}

export const notFound = (what: string) => new CoreError("not_found", `${what} not found`);
export const conflictError = (message: string, details?: unknown) => new CoreError("conflict", message, details);
export const invalid = (message: string, details?: unknown) => new CoreError("validation_failed", message, details);

export function isCoreError(e: unknown): e is CoreError {
  return e instanceof CoreError;
}
