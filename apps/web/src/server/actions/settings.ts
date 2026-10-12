"use server";

import { createApiKey, revokeApiKey, updateProfile } from "@trellala/core";
import { apiKeyIdSchema, createApiKeySchema, profileSchema } from "@trellala/core/schemas";
import { runAction } from "../action";

export async function updateProfileAction(input: unknown) {
  return runAction(profileSchema, input, (data, { actor }) => updateProfile(actor, data));
}

export async function createApiKeyAction(input: unknown) {
  return runAction(createApiKeySchema, input, (data, { actor }) => createApiKey(actor, data));
}

export async function revokeApiKeyAction(input: unknown) {
  return runAction(apiKeyIdSchema, input, ({ apiKeyId }, { actor }) => revokeApiKey(actor, apiKeyId));
}
