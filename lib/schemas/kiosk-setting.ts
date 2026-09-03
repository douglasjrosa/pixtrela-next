import { z } from "zod";

export const MIN_KIOSK_SESSION_IDLE_SECONDS = 1;
export const MAX_KIOSK_SESSION_IDLE_SECONDS = 3600;
export const DEFAULT_KIOSK_SESSION_IDLE_SECONDS = 7;

export const MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS = 0;
export const MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS = 86400;
export const DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS = 300;

export const MIN_KIOSK_QUEUE_PAGE_SIZE = 1;
export const MAX_KIOSK_QUEUE_PAGE_SIZE = 50;
export const DEFAULT_KIOSK_QUEUE_PAGE_SIZE = 15;

export const kioskSessionIdleSchema = z.object({
  sessionIdleSeconds: z
    .number()
    .int()
    .min(MIN_KIOSK_SESSION_IDLE_SECONDS)
    .max(MAX_KIOSK_SESSION_IDLE_SECONDS),
  maxSimultaneousSubtaskIntervalSeconds: z
    .number()
    .int()
    .min(MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS)
    .max(MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS),
  queuePageSize: z
    .number()
    .int()
    .min(MIN_KIOSK_QUEUE_PAGE_SIZE)
    .max(MAX_KIOSK_QUEUE_PAGE_SIZE),
});

export type KioskSessionIdleInput = z.infer<typeof kioskSessionIdleSchema>;

export function normalizeKioskQueuePageSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_KIOSK_QUEUE_PAGE_SIZE;
  const rounded = Math.trunc(value);
  if (rounded < MIN_KIOSK_QUEUE_PAGE_SIZE) return MIN_KIOSK_QUEUE_PAGE_SIZE;
  if (rounded > MAX_KIOSK_QUEUE_PAGE_SIZE) return MAX_KIOSK_QUEUE_PAGE_SIZE;
  return rounded;
}
