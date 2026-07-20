import { toast } from "sonner";

export const HINT_TOAST_DURATION_MS = 2000;

export function showSuccessToast(message: string): void {
  toast.success(message);
}

export function showErrorToast(message: string): void {
  toast.error(message);
}

export function showHintToast(message: string): void {
  toast(message, { duration: HINT_TOAST_DURATION_MS });
}

export interface ConfirmToastOptions {
  message: string;
  yesLabel: string;
  noLabel: string;
  onYes: () => void;
  onNo?: () => void;
}

/** Sim (cancel/left) exits; Não (action/right) stays — matches ConfirmDialog layout. */
export function showConfirmToast(options: ConfirmToastOptions): void {
  toast(options.message, {
    duration: Infinity,
    cancel: {
      label: options.yesLabel,
      onClick: options.onYes,
    },
    action: {
      label: options.noLabel,
      onClick: options.onNo ?? (() => undefined),
    },
  });
}
