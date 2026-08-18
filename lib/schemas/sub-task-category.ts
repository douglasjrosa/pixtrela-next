import { z } from "zod";

import {
  isValidMaterialFlagRef,
  normalizeMaterialFlagRef,
} from "@/lib/business/material-flag-code";

export const subTaskCategoryFormSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  ref: z
    .string()
    .trim()
    .min(1)
    .refine(isValidMaterialFlagRef, { message: "invalidRef" })
    .transform(normalizeMaterialFlagRef),
});

export type SubTaskCategoryFormInput = z.infer<typeof subTaskCategoryFormSchema>;

export const SETTINGS_ENTITY_LIST_PAGE_SIZE = 10;
export const SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS = 3;

export const subTaskCategoryListSortSchema = z.object({
  column: z.enum(["name", "ref"]).default("name"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

export const subTaskCategoryListFiltersSchema = z
  .object({
    q: z.string().optional(),
  })
  .merge(subTaskCategoryListSortSchema)
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
      column: data.column,
      direction: data.direction,
    };
  });

export type SubTaskCategoryListFilters = z.infer<
  typeof subTaskCategoryListFiltersSchema
>;
