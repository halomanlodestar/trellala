import "server-only";
import { auth } from "@trellala/core";
import type { Actor, SessionUser } from "@trellala/core/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/** Current user or null. Deduped per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, image } = session.user;
  return { id, name, email, image: image ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export const userActor = (user: SessionUser): Actor & { type: "USER" } => ({ type: "USER", userId: user.id });
