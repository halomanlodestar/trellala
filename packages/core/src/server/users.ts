import { prisma } from "@trellala/db";
import { notFound } from "../errors";
import type { Actor } from "../types";
import { logActivity } from "./activity";

export async function updateProfile(actor: Actor & { type: "USER" }, input: { name: string; skills: string[] }) {
  return prisma.$transaction(async (tx) => {
    const u = await tx.user.findUnique({ where: { id: actor.userId }, select: { name: true, skills: true } });
    if (!u) throw notFound("User");
    await tx.user.update({ where: { id: actor.userId }, data: input });
    await logActivity(tx, actor, { action: "user.updated", entityType: "User", entityId: actor.userId, before: u, after: input });
  });
}
