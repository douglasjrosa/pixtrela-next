const KIOSK_ACTION_ERROR_CODES = [
  "flagsRequired",
  "subTaskHasNoCategory",
  "flagWrongCategory",
  "flagOccupied",
  "chainStopInconsistent",
  "atWorkerCapacity",
  "alreadyActive",
  "subTaskLocked",
  "subTaskDisabled",
  "qtyComplete",
  "notAssigned",
  "noOpenSession",
  "chainBlocked",
  "chainComplete",
  "chainNotJoinable",
  "notStartable",
  "notFound",
] as const;

export type KioskActionErrorFallback = "startFailed" | "exitFailed";

export type KioskActionErrorTranslate = (key: string) => string;

function readErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

export function kioskActionErrorMessage(
  t: KioskActionErrorTranslate,
  error: unknown,
  fallback: KioskActionErrorFallback,
): string {
  const code = readErrorCode(error);
  if ((KIOSK_ACTION_ERROR_CODES as readonly string[]).includes(code)) {
    return t(code);
  }
  return t(fallback);
}
