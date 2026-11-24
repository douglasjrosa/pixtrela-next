import { z } from "zod";

import { isPanelSlug, PANEL_SLUG_MAX_LENGTH } from "@/lib/business/panel-slug";

export const PANEL_NAME_MAX_LENGTH = 128;

export const panelFormSchema = z.object({
  name: z.string().trim().min(1).max(PANEL_NAME_MAX_LENGTH),
  slug: z
    .string()
    .trim()
    .max(PANEL_SLUG_MAX_LENGTH)
    .optional()
    .refine((value) => !value || isPanelSlug(value), "invalidSlug"),
  stepId: z.string().uuid(),
  teamIds: z.array(z.string().uuid()).min(1),
});

export type PanelFormInput = z.infer<typeof panelFormSchema>;
