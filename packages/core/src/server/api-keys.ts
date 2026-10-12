import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@trellala/db";
import { CoreError, conflictError, notFound } from "../errors";
import type { Actor, ApiKeyView, CreatedApiKey } from "../types";
import { logActivity } from "./activity";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

const include = { createdBy: { select: { name: true } } } as const;

function toView(k: { id: string; name: string; source: string; prefix: string; lastUsedAt: Date | null; revokedAt: Date | null; createdAt: Date; createdBy: { name: string } }): ApiKeyView {
  return { id: k.id, name: k.name, source: k.source, prefix: k.prefix, lastUsedAt: k.lastUsedAt, revokedAt: k.revokedAt, createdAt: k.createdAt, createdByName: k.createdBy.name };
}

/** Creates a key; the plaintext token is returned once and never stored. */
export async function createApiKey(actor: Actor & { type: "USER" }, input: { name: string; source: string }): Promise<CreatedApiKey> {
  const token = `trl_${randomBytes(24).toString("base64url")}`;
  return prisma.$transaction(async (tx) => {
    const k = await tx.apiKey.create({
      data: { name: input.name, source: input.source, prefix: token.slice(0, 10), hashedKey: hash(token), createdById: actor.userId },
      include,
    });
    await logActivity(tx, actor, { action: "api_key.created", entityType: "ApiKey", entityId: k.id, after: { name: k.name, source: k.source } });
    return { apiKey: toView(k), token };
  });
}

export async function revokeApiKey(actor: Actor & { type: "USER" }, apiKeyId: string) {
  return prisma.$transaction(async (tx) => {
    const k = await tx.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!k) throw notFound("API key");
    if (k.revokedAt) throw conflictError("Already revoked");
    await tx.apiKey.update({ where: { id: apiKeyId }, data: { revokedAt: new Date() } });
    await logActivity(tx, actor, { action: "api_key.revoked", entityType: "ApiKey", entityId: k.id, before: { name: k.name } });
  });
}

export async function listApiKeys(): Promise<ApiKeyView[]> {
  const rows = await prisma.apiKey.findMany({ include, orderBy: { createdAt: "desc" } });
  return rows.map(toView);
}

/** Resolves a bearer token. Throws unauthorized (unknown) or forbidden (revoked). */
export async function authenticateApiKey(token: string | null): Promise<{ id: string; source: string; name: string }> {
  if (!token || !token.startsWith("trl_")) throw new CoreError("unauthorized", "Missing or invalid API key");
  const k = await prisma.apiKey.findUnique({ where: { hashedKey: hash(token) } });
  if (!k) throw new CoreError("unauthorized", "Missing or invalid API key");
  if (k.revokedAt) throw new CoreError("forbidden", "API key revoked");
  await prisma.apiKey.update({ where: { id: k.id }, data: { lastUsedAt: new Date() } });
  return { id: k.id, source: k.source, name: k.name };
}
