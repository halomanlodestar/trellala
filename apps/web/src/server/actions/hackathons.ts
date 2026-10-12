"use server";

import { archiveHackathon, createHackathon, setStage, unarchiveHackathon, updateHackathon } from "@trellala/core";
import { archiveSchema, hackathonFormSchema, hackathonIdSchema, idSchema, setStageSchema } from "@trellala/core/schemas";
import { z } from "zod";
import { runAction } from "../action";

export async function createHackathonAction(input: unknown) {
  return runAction(hackathonFormSchema, input, (data, { actor }) => createHackathon(actor, data));
}

export async function updateHackathonAction(input: unknown) {
  return runAction(z.object({ hackathonId: idSchema, data: hackathonFormSchema }), input, ({ hackathonId, data }, { actor }) =>
    updateHackathon(actor, hackathonId, data),
  );
}

export async function setStageAction(input: unknown) {
  return runAction(setStageSchema, input, ({ hackathonId, stage }, { actor }) => setStage(actor, hackathonId, stage));
}

export async function archiveHackathonAction(input: unknown) {
  return runAction(archiveSchema, input, ({ hackathonId, reason, note }, { actor }) => archiveHackathon(actor, hackathonId, reason, note));
}

export async function unarchiveHackathonAction(input: unknown) {
  return runAction(hackathonIdSchema, input, ({ hackathonId }, { actor }) => unarchiveHackathon(actor, hackathonId));
}
