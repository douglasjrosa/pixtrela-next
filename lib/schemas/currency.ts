import { z } from "zod";

import { roundCurrencyRate } from "@/lib/format/currency-rate";

export const currencyFormSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  pluralTitle: z.string().min(1),
  iconMediaId: z
    .union([z.number().int().positive(), z.string().uuid()])
    .nullable()
    .optional(),
  currencyPerSecond: z
    .number()
    .min(0)
    .transform((value) => roundCurrencyRate(value)),
  exchangeRate: z
    .number()
    .finite()
    .default(0)
    .transform((value) => roundCurrencyRate(value)),
  showInStore: z.boolean().default(true),
});

export type CurrencyFormInput = z.infer<typeof currencyFormSchema>;

export { bulkDocumentIdsSchema as bulkCurrencyIdsSchema } from "./bulk-ids";
