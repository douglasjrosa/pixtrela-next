import { z } from "zod";

export const TEMPLATE_LIST_PAGE_SIZE = 10;
export const TEMPLATE_LIST_SEARCH_MIN_CHARS = 3;
export const TEMPLATE_LIST_SEARCH_DEBOUNCE_MS = 300;

export const templateListFiltersSchema = z
  .object({
    q: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (
      trimmedQ.length > 0 &&
      trimmedQ.length < TEMPLATE_LIST_SEARCH_MIN_CHARS
    ) {
      ctx.addIssue({
        code: "custom",
        message: "qTooShort",
        path: ["q"],
      });
    }
  })
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= TEMPLATE_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
    };
  });

export type TemplateListFilters = z.infer<typeof templateListFiltersSchema>;
export type TemplateListFiltersInput = z.input<typeof templateListFiltersSchema>;
