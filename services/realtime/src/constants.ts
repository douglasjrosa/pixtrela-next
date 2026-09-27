export const BOARD_CHANNEL = "board";
export const PUBLISH_MESSAGE = "invalidate";
export const SSE_EVENT_NAME = "board-invalidate";

export const HEARTBEAT_INTERVAL_MS = 15_000;
export const JWT_MAX_TTL_SECONDS = 120;
export const JWT_CLOCK_SKEW_SECONDS = 5;
export const JWT_ALGORITHM = "HS256";
export const MIN_SECRET_LENGTH = 32;
export const MAX_TOKEN_LENGTH = 2_048;
export const MAX_PUBLISH_BODY_BYTES = 1_024;

export const DEFAULT_PORT = 8787;
export const REDIS_DEFAULT_URL = "redis://127.0.0.1:6379";
export const MILLISECONDS_PER_SECOND = 1_000;
export const MIN_TCP_PORT = 1;
export const MAX_TCP_PORT = 65_535;

export const HEALTH_PATH = "/health";
export const PUBLISH_PATH = "/internal/publish";
export const BOARD_EVENTS_PATH = "/events/board";

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_NO_CONTENT = 204;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;
export const HTTP_STATUS_UNAVAILABLE = 503;

export const BEARER_SCHEME = "bearer ";
