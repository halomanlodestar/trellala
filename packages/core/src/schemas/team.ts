import { z } from "zod";
import { SETTABLE_PROGRESS_STATES, TEAM_STATUSES } from "../constants/enums";
import { dateSchema, idSchema, optionalText, optionalUrl } from "./common";

export const teamFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  ideaTitle: optionalText(200),
  ideaDescription: optionalText(10000),
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  submissionUrl: optionalUrl,
  memberIds: z.array(idSchema).max(50).transform((ids) => [...new Set(ids)]),
});

export const createTeamSchema = teamFormSchema.extend({ hackathonId: idSchema });
export const updateTeamSchema = teamFormSchema.extend({ teamId: idSchema });

export const setTeamStatusSchema = z.object({
  teamId: idSchema,
  status: z.enum(TEAM_STATUSES).exclude(["MISSED"]),
  wonPrizeId: idSchema.nullish().transform((v) => v ?? null),
});

export const setProgressSchema = z.object({
  teamId: idSchema,
  milestoneId: idSchema,
  state: z.enum(SETTABLE_PROGRESS_STATES),
  proofUrl: optionalUrl,
  note: optionalText(2000),
});

export const teamMilestoneFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  action: optionalText(4000),
  endsAt: dateSchema,
});

export const createTeamMilestoneSchema = teamMilestoneFormSchema.extend({ teamId: idSchema });
export const deleteTeamMilestoneSchema = z.object({ milestoneId: idSchema });
