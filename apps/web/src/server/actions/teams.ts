"use server";

import { createTeam, createTeamMilestone, deleteTeamMilestone, setProgress, setTeamStatus, updateTeam } from "@trellala/core";
import {
  createTeamMilestoneSchema,
  createTeamSchema,
  deleteTeamMilestoneSchema,
  setProgressSchema,
  setTeamStatusSchema,
  updateTeamSchema,
} from "@trellala/core/schemas";
import { runAction } from "../action";

export async function createTeamAction(input: unknown) {
  return runAction(createTeamSchema, input, (data, { actor }) => createTeam(actor, data));
}

export async function updateTeamAction(input: unknown) {
  return runAction(updateTeamSchema, input, (data, { actor }) => updateTeam(actor, data));
}

export async function setTeamStatusAction(input: unknown) {
  return runAction(setTeamStatusSchema, input, (data, { actor }) => setTeamStatus(actor, data));
}

export async function setProgressAction(input: unknown) {
  return runAction(setProgressSchema, input, (data, { actor }) => setProgress(actor, data));
}

export async function createTeamMilestoneAction(input: unknown) {
  return runAction(createTeamMilestoneSchema, input, (data, { actor }) => createTeamMilestone(actor, data));
}

export async function deleteTeamMilestoneAction(input: unknown) {
  return runAction(deleteTeamMilestoneSchema, input, ({ milestoneId }, { actor }) => deleteTeamMilestone(actor, milestoneId));
}
