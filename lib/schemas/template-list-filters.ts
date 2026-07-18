import { z } from "zod";

export const TEMPLATE_LIST_PAGE_SIZE = 10;
export const TEMPLATE_LIST_NAME_MIN_CHARS = 3;
export const TEMPLATE_LIST_CODE_MIN_CHARS = 1;
export const TEMPLATE_LIST_SEARCH_DEBOUNCE_MS = 300;

export const templateListFiltersSchema = z
  .object({
    q: z.string().optional(),
    code: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const trimmedQ = data.q?.trim() ?? "";
    if (trimmedQ.length > 0 && trimmedQ.length < TEMPLATE_LIST_NAME_MIN_CHARS) {
      ctx.addIssue({
        code: "custom",
        message: "qTooShort",
        path: ["q"],
      });
    }
    const trimmedCode = data.code?.trim() ?? "";
    if (
      trimmedCode.length > 0 &&
      trimmedCode.length < TEMPLATE_LIST_CODE_MIN_CHARS
    ) {
      ctx.addIssue({
        code: "custom",
        message: "codeTooShort",
        path: ["code"],
      });
    }
  })
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    const trimmedCode = data.code?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= TEMPLATE_LIST_NAME_MIN_CHARS ? trimmedQ : undefined,
      code:
        trimmedCode.length >= TEMPLATE_LIST_CODE_MIN_CHARS
          ? trimmedCode
          : undefined,
    };
  });

export type TemplateListFilters = z.infer<typeof templateListFiltersSchema>;
export type TemplateListFiltersInput = z.input<typeof templateListFiltersSchema>;
