import "server-only";
import * as core from "@trellala/core";
import { requireUser } from "../auth";

export async function loadQueue(opts: { mine?: boolean; tag?: string; prize?: boolean }) {
  const user = await requireUser();
  return { user, groups: await core.getActionQueue({ userId: opts.mine ? user.id : undefined, tag: opts.tag, prize: opts.prize }) };
}
