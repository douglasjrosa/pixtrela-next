import { z } from "zod";

export const currencyForSubtasksSchema = z.object({
  currencyDocumentId: z.string().min(1),
});

export type CurrencyForSubtasksInput = z.infer<typeof currencyForSubtasksSchema>;
