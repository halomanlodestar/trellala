import type { createApiKeySchema, profileSchema, teamFormSchema, teamMilestoneFormSchema } from "@trellala/core/schemas";
import type { z } from "zod";

export type TeamFormInput = z.input<typeof teamFormSchema>;
export type TeamFormData = z.output<typeof teamFormSchema>;
export type TeamMilestoneFormInput = z.input<typeof teamMilestoneFormSchema>;
export type TeamMilestoneFormData = z.output<typeof teamMilestoneFormSchema>;
export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormData = z.output<typeof profileSchema>;
export type ApiKeyFormInput = z.input<typeof createApiKeySchema>;
export type ApiKeyFormData = z.output<typeof createApiKeySchema>;
