import { isExchangeWindowOpen } from "@/lib/domain/exchange";

export type ProducerExchangeWindow = {
  exchangesFirstDay: number;
  exchangesLastDay: number;
};

/**
 * Leader shop window: open when any led (or membership) team is in window.
 * Prefer an open window for display; otherwise keep the first team days.
 */
export function pickProducerExchangeWindow<T extends ProducerExchangeWindow>(
  windows: T[],
  now: Date,
): T | null {
  if (windows.length === 0) return null;
  return windows.find((window) => isExchangeWindowOpen(window, now))
    ?? windows[0]
    ?? null;
}
