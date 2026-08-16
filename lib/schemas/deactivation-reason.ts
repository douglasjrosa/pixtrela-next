import { z } from "zod";

export const DEACTIVATION_REASON_MIN_LENGTH = 100;

export const DEACTIVATION_REASON_MIN_LENGTH_KEY = "reasonMinLength";

export const BULK_DEACTIVATION_REASON_MIN_LENGTH = 50;

export const BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY = "reasonMinLength50";

/** Shared Zod refine for Task/SubTask deactivation reason fields. */
export function refineDeactivationReason(
  reason: string | undefined,
  ctx: z.RefinementCtx,
  path: Array<string | number>,
  minLength = DEACTIVATION_REASON_MIN_LENGTH,
  messageKey = DEACTIVATION_REASON_MIN_LENGTH_KEY,
): void {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length >= minLength) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: messageKey,
    path,
  });
}
