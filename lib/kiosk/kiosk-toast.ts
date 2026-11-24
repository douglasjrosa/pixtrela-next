import {
  BOTTOM_CENTER_TOAST_POSITION,
  INFO_TOAST_DURATION_MS,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/ui/app-toast";

const KIOSK_TOAST_POSITION = BOTTOM_CENTER_TOAST_POSITION;

export function showKioskSuccessToast(message: string): void {
  showSuccessToast(message, { position: KIOSK_TOAST_POSITION });
}

export function showKioskErrorToast(message: string): void {
  showErrorToast(message, { position: KIOSK_TOAST_POSITION });
}

export function showKioskInfoToast(message: string): void {
  showInfoToast(message, {
    position: KIOSK_TOAST_POSITION,
    duration: INFO_TOAST_DURATION_MS,
  });
}
