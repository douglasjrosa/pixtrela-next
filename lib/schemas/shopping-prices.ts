import { z } from "zod";

import { roundCurrencyRate } from "@/lib/format/currency-rate";

export const shoppingPriceRowSchema = z.object({
  awardId: z.string().uuid(),
  actualPrice: z.coerce
    .number()
    .finite()
    .transform((value) => roundCurrencyRate(value)),
});

export const shoppingPriceUpdatesSchema = z.object({
  awards: z.array(shoppingPriceRowSchema).min(1),
});

export type ShoppingPriceRowInput = z.infer<typeof shoppingPriceRowSchema>;
export type ShoppingPriceUpdatesInput = z.infer<
  typeof shoppingPriceUpdatesSchema
>;
