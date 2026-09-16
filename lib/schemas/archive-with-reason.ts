import { z } from "zod";

import {
  BULK_DEACTIVATION_REASON_MIN_LENGTH,
  BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY,
  DEACTIVATION_REASON_MIN_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH_KEY,
  refineDeactivationReason,
} from "./deactivation-reason";

const REASON_FIELD = "reasonForDeactivation" as const;

/**
 * Builds a Zod schema for archive reason text.
 * Single-record and bulk archives require at least 30 chars.
 */
export function archiveWithReasonSchema(recordCount: number) {
  const isBulk = recordCount >= 2;
  const minLength = isBulk
    ? BULK_DEACTIVATION_REASON_MIN_LENGTH
    : DEACTIVATION_REASON_MIN_LENGTH;
  const messageKey = isBulk
    ? BULK_DEACTIVATION_REASON_MIN_LENGTH_KEY
    : DEACTIVATION_REASON_MIN_LENGTH_KEY;

  return z
    .object({
      reasonForDeactivation: z.string(),
    })
    .superRefine((data, ctx) => {
      refineDeactivationReason(
        data.reasonForDeactivation,
        ctx,
        [REASON_FIELD],
        minLength,
        messageKey,
      );
    });
}

export type ArchiveWithReasonInput = z.infer<
  ReturnType<typeof archiveWithReasonSchema>
>;

/** Parses and trims reason text for the given record count. */
export function parseArchiveReason(
  reason: string,
  recordCount: number,
): string {
  const parsed = archiveWithReasonSchema(recordCount).parse({
    reasonForDeactivation: reason,
  });
  return parsed.reasonForDeactivation.trim();
}
