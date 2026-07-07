import { z } from "zod";

export const currencyRateSchema = z.object({
  documentId: z.string().min(1),
  currencyPerSecond: z.number().min(0),
});

export const currencyRatesFormSchema = z.object({
  rates: z.array(currencyRateSchema).min(1),
});

export type CurrencyRateInput = z.infer<typeof currencyRateSchema>;
export type CurrencyRatesFormInput = z.infer<typeof currencyRatesFormSchema>;
