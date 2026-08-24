import { z } from "zod";

export const cartDraftItemSchema = z.object({
  awardId: z.string().uuid(),
  currencyId: z.string().uuid(),
  qty: z.number().int().min(0),
});

export const cartDraftPayloadSchema = z.object({
  items: z.array(cartDraftItemSchema),
});

export type CartDraftPayload = z.infer<typeof cartDraftPayloadSchema>;
