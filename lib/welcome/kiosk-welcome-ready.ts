export const KIOSK_WELCOME_READY_EVENT = "kiosk-welcome-ready";

let kioskColaboratorReady = false;

export function resetKioskColaboratorReady(): void {
  kioskColaboratorReady = false;
}

export function isKioskColaboratorReady(): boolean {
  return kioskColaboratorReady;
}

export function markKioskColaboratorReady(): void {
  kioskColaboratorReady = true;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(KIOSK_WELCOME_READY_EVENT));
}