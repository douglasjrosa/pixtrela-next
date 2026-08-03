import { z } from "zod";

import { MIN_USER_TAG_LENGTH } from "@/lib/kiosk/user-tag";

export const kioskTagIdentifySchema = z.object({
  userTag: z
    .string()
    .trim()
    .min(MIN_USER_TAG_LENGTH)
    .transform((value) =>
      value.toUpperCase().replace(/[:\-\s]/g, ""),
    )
    .refine((value) => value.length >= MIN_USER_TAG_LENGTH),
});

export type KioskTagIdentifyInput = z.infer<typeof kioskTagIdentifySchema>;
