import type { ActionError as ActionErrorData } from "@/types";

/** Thrown by mutation hooks when a server action returns { ok: false }. */
export class ActionError extends Error {
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(data: ActionErrorData) {
    super(data.message);
    this.code = data.code;
    this.fields = data.fields;
  }
}
