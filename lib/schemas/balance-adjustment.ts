import { z } from "zod";

export const balanceAdjustmentSchema = z.object({
  colaboratorDocumentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currencyId: z.string().uuid(),
  amount: z.coerce.number().refine((value) => value !== 0, {
    message: "amountRequired",
  }),
});

export type BalanceAdjustmentInput = z.infer<typeof balanceAdjustmentSchema>;
