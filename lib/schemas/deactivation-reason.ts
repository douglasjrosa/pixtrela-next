import { z } from "zod";

export const DEACTIVATION_REASON_MIN_LENGTH = 100;

export const DEACTIVATION_REASON_MIN_LENGTH_KEY = "reasonMinLength";

/** Shared Zod refine for Task/SubTask deactivation reason fields. */
export function refineDeactivationReason(
  reason: string | undefined,
  ctx: z.RefinementCtx,
  path: Array<string | number>,
): void {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length >= DEACTIVATION_REASON_MIN_LENGTH) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: DEACTIVATION_REASON_MIN_LENGTH_KEY,
    path,
  });
}
