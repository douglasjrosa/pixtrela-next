import { z } from "zod";

export const currencyForSubtasksSchema = z.object({
  currencyDocumentId: z.string(),
});

export type CurrencyForSubtasksInput = z.infer<typeof currencyForSubtasksSchema>;
