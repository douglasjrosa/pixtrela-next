import { z } from "zod";

export const currencyFormSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  pluralTitle: z.string().min(1),
  iconMediaId: z.number().int().positive().nullable().optional(),
  currencyPerSecond: z.number().min(0),
});

export type CurrencyFormInput = z.infer<typeof currencyFormSchema>;
