export const KIOSK_IDLE_MS = 7000;

export type IdleCallback = () => void;

/** Creates an idle timer that fires after KIOSK_IDLE_MS of inactivity. */
export function createKioskIdleTimer(onIdle: IdleCallback): {
  reset: () => void;
  clear: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clear(): void {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function reset(): void {
    clear();
    timer = setTimeout(onIdle, KIOSK_IDLE_MS);
  }

  return { reset, clear };
}
