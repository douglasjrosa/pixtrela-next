import { z } from "zod";

import type { SubTaskFormInput } from "./sub-task";

export const kioskExitDurationSchema = z.object({
  sharingType: z.literal("duration"),
  isCompleted: z.boolean(),
});

export function createKioskExitQtySchema(maxQty: number) {
  return z.object({
    sharingType: z.literal("qty"),
    qtyCompleted: z.number().int().min(1).max(maxQty),
  });
}

export type KioskExitDurationInput = z.infer<typeof kioskExitDurationSchema>;
export type KioskExitQtyInput = z.infer<ReturnType<typeof createKioskExitQtySchema>>;
export type KioskExitInput = KioskExitDurationInput | KioskExitQtyInput;

export function parseKioskExitInput(
  sharingType: SubTaskFormInput["sharingType"],
  values: unknown,
  options?: { maxQty?: number },
): KioskExitInput {
  if (sharingType === "duration") {
    return kioskExitDurationSchema.parse(values);
  }
  const maxQty = Math.max(1, options?.maxQty ?? 1);
  return createKioskExitQtySchema(maxQty).parse(values);
}

export function toActivityStopPayload(input: KioskExitInput): {
  completed?: boolean;
  qty?: number;
} {
  if (input.sharingType === "duration") {
    return { completed: input.isCompleted };
  }
  return { qty: input.qtyCompleted };
}
