import { z } from "zod";

import { USER_PASSWORD_MIN_LENGTH } from "@/lib/schemas/user";

export const KIOSK_IDENTIFY_INVALID_CODE_KEY = "invalidCode";
export const KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY = "passwordMinLength";

export const kioskIdentifySchema = z.object({
  code: z.coerce
    .number()
    .int({ message: KIOSK_IDENTIFY_INVALID_CODE_KEY })
    .min(0, { message: KIOSK_IDENTIFY_INVALID_CODE_KEY }),
  password: z.string().min(USER_PASSWORD_MIN_LENGTH, {
    message: KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY,
  }),
});

export type KioskIdentifyInput = z.infer<typeof kioskIdentifySchema>;
