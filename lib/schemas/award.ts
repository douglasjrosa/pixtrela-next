import { z } from "zod";

export const awardValueSchema = z.object({
  numberOf: z.number().int().min(1),
  currencyDocumentId: z.string().min(1),
});

export const awardFormSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  warnings: z.string().optional(),
  imageId: z
    .union([z.number().int().positive(), z.string().uuid()])
    .nullable()
    .optional(),
  showInStore: z.boolean(),
  stock: z.number().int().min(0),
  values: z.array(awardValueSchema).min(1),
});

export type AwardFormInput = z.infer<typeof awardFormSchema>;

export const bulkAwardIdsSchema = z
  .array(z.string().trim().min(1))
  .min(1, "emptySelection");
