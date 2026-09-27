export const BOARD_REALTIME_CHANNEL = "board";
export const BOARD_INVALIDATE_EVENT = "board-invalidate";
export const BOARD_EVENTS_PATH = "/events/board";
export const BOARD_REALTIME_TOKEN_PATH = "/api/realtime/board-token";
export const REALTIME_TOKEN_TTL_SECONDS = 120;
export const REALTIME_PUBLISH_TIMEOUT_MS = 2_000;

export function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}
