import { z } from "zod";

export const MIN_KIOSK_SESSION_IDLE_SECONDS = 1;
export const MAX_KIOSK_SESSION_IDLE_SECONDS = 3600;
export const DEFAULT_KIOSK_SESSION_IDLE_SECONDS = 7;

export const kioskSessionIdleSchema = z.object({
  sessionIdleSeconds: z
    .number()
    .int()
    .min(MIN_KIOSK_SESSION_IDLE_SECONDS)
    .max(MAX_KIOSK_SESSION_IDLE_SECONDS),
});

export type KioskSessionIdleInput = z.infer<typeof kioskSessionIdleSchema>;
