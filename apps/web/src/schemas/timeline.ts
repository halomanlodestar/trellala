import { z } from "zod";

/** /timeline query string. Unknown values fall back to the defaults instead of erroring. */
export const timelineParamsSchema = z.object({
  view: z.enum(["lanes", "calendar"]).catch("lanes"),
  zoom: z.enum(["2w", "6w", "3m"]).catch("6w"),
});
