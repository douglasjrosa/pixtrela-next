import { toast, type ExternalToast } from "sonner";

export const HINT_TOAST_DURATION_MS = 2000;
export const BOTTOM_CENTER_TOAST_POSITION = "bottom-center" as const;

export type AppToastPosition = ExternalToast["position"];

export interface AppToastOptions {
  toastId?: string | number;
  position?: AppToastPosition;
}

export function showLoadingToast(
  message: string,
  options?: Pick<AppToastOptions, "position">,
): string | number {
  return toast.loading(message, {
    position: options?.position ?? BOTTOM_CENTER_TOAST_POSITION,
  });
}

function resolveToastPosition(
  options?: AppToastOptions,
): AppToastPosition | undefined {
  if (options?.position) return options.position;
  if (options?.toastId) return BOTTOM_CENTER_TOAST_POSITION;
  return undefined;
}

export function showSuccessToast(
  message: string,
  options?: AppToastOptions,
): void {
  toast.success(message, {
    id: options?.toastId,
    position: resolveToastPosition(options),
  });
}

export function showErrorToast(message: string, options?: AppToastOptions): void {
  toast.error(message, {
    id: options?.toastId,
    position: resolveToastPosition(options),
  });
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
