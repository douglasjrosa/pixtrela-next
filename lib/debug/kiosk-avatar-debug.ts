export type KioskAvatarDebugStep = {
  step: string;
  hypothesisId?: "A" | "B" | "C" | "D" | "E";
  data?: Record<string, unknown>;
  at: string;
};

export type KioskAvatarDebugTrace = {
  steps: KioskAvatarDebugStep[];
};

export function createAvatarDebugTrace(): KioskAvatarDebugTrace {
  return { steps: [] };
}

export function pushAvatarDebugStep(
  trace: KioskAvatarDebugTrace,
  step: string,
  data?: Record<string, unknown>,
  hypothesisId?: KioskAvatarDebugStep["hypothesisId"],
): void {
  trace.steps.push({
    step,
    hypothesisId,
    data,
    at: new Date().toISOString(),
  });
}

export function emitAvatarDebugLog(
  trace: KioskAvatarDebugTrace,
  location: string,
  message: string,
): void {
  // #region agent log
  fetch("http://127.0.0.1:7415/ingest/497d8289-cd59-4295-9a40-eec9965336a4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "33820a",
    },
    body: JSON.stringify({
      sessionId: "33820a",
      location,
      message,
      data: { steps: trace.steps },
      timestamp: Date.now(),
      runId: "prod-avatar",
    }),
  }).catch(() => {});
  // #endregion
}
