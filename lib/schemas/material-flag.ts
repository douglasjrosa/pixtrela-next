import { z } from "zod";

import { SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS } from "./sub-task-category";

export const MAX_MATERIAL_FLAGS_PER_BATCH = 500;

export const materialFlagFormSchema = z.object({
  subTaskCategoryId: z.string().uuid(),
  index: z.number().int().min(1),
});

export type MaterialFlagFormInput = z.infer<typeof materialFlagFormSchema>;

export const materialFlagBulkCreateSchema = z
  .object({
    subTaskCategoryId: z.string().uuid(),
    indexFrom: z.number().int().min(1),
    indexTo: z.number().int().min(1),
  })
  .refine((data) => data.indexTo >= data.indexFrom, {
    message: "invalidRange",
    path: ["indexTo"],
  })
  .refine(
    (data) => data.indexTo - data.indexFrom + 1 <= MAX_MATERIAL_FLAGS_PER_BATCH,
    {
      message: "batchTooLarge",
      path: ["indexTo"],
    },
  );

export type MaterialFlagBulkCreateInput = z.infer<
  typeof materialFlagBulkCreateSchema
>;

export const materialFlagListSortSchema = z.object({
  column: z.enum(["code", "category", "index"]).default("code"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

export const materialFlagListFiltersSchema = z
  .object({
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
  })
  .merge(materialFlagListSortSchema)
  .transform((data) => {
    const trimmedQ = data.q?.trim() ?? "";
    return {
      q:
        trimmedQ.length >= SETTINGS_ENTITY_LIST_SEARCH_MIN_CHARS
          ? trimmedQ
          : undefined,
      categoryId: data.categoryId,
      column: data.column,
      direction: data.direction,
    };
  });

export type MaterialFlagListFilters = z.infer<
  typeof materialFlagListFiltersSchema
>;
