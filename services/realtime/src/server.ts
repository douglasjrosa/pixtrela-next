import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import {
  BOARD_CHANNEL,
  BOARD_EVENTS_PATH,
  HEALTH_PATH,
  HEARTBEAT_INTERVAL_MS,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_UNAVAILABLE,
  MAX_PUBLISH_BODY_BYTES,
  MILLISECONDS_PER_SECOND,
  PUBLISH_MESSAGE,
  PUBLISH_PATH,
  SSE_EVENT_NAME,
} from "./constants.js";
import { verifyRealtimeToken } from "./jwt.js";
import { logError } from "./logger.js";
import { isAuthorizedPublisher } from "./publish-auth.js";
import { isRecord } from "./records.js";
import { formatSseComment, formatSseEvent } from "./sse.js";

export type Subscription = {
  close: () => Promise<void>;
};

export type RealtimeServerOptions = {
  publishSecret: string;
  jwtSecret: string;
  publish: (channel: string, message: string) => Promise<void>;
  openSubscription: (
    channel: string,
    onMessage: (message: string) => void,
  ) => Promise<Subscription>;
  heartbeatIntervalMs?: number;
  nowSeconds?: () => number;
};

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
  "x-accel-buffering": "no",
  "access-control-allow-origin": "*",
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

type BodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: number };

export function createRealtimeServer(options: RealtimeServerOptions): Server {
  return createServer((request, response) => {
    void route(request, response, options).catch(() => {
      logError("request_failed");
      if (!response.headersSent && !response.destroyed) {
        writeJson(response, HTTP_STATUS_UNAVAILABLE, { error: "unavailable" });
      }
    });
  });
}

async function route(
  request: IncomingMessage,
  response: ServerResponse,
  options: RealtimeServerOptions,
): Promise<void> {
  const url = parseRequestUrl(request.url);
  if (!url) {
    writeJson(response, HTTP_STATUS_NOT_FOUND, { error: "not_found" });
    return;
  }
  const method = request.method ?? "GET";
  if (method === "GET" && url.pathname === HEALTH_PATH) {
    writeJson(response, HTTP_STATUS_OK, { ok: true });
    return;
  }
  if (method === "POST" && url.pathname === PUBLISH_PATH) {
    await handlePublish(request, response, options);
    return;
  }
  if (method === "GET" && url.pathname === BOARD_EVENTS_PATH) {
    await handleBoardEvents(response, options, url);
    return;
  }
  writeJson(response, HTTP_STATUS_NOT_FOUND, { error: "not_found" });
}

async function handlePublish(
  request: IncomingMessage,
  response: ServerResponse,
  options: RealtimeServerOptions,
): Promise<void> {
  const authorization = singleHeader(request.headers.authorization);
  if (!isAuthorizedPublisher(authorization, options.publishSecret)) {
    request.resume();
    writeJson(response, HTTP_STATUS_UNAUTHORIZED, { error: "unauthorized" });
    return;
  }
  const body = await readJsonBody(request);
  if (!body.ok) {
    writeJson(response, body.status, { error: "invalid_body" });
    return;
  }
  if (!isBoardPublish(body.value)) {
    writeJson(response, HTTP_STATUS_BAD_REQUEST, { error: "invalid_channel" });
    return;
  }
  try {
    await options.publish(BOARD_CHANNEL, PUBLISH_MESSAGE);
  } catch {
    logError("publish_failed", { channel: BOARD_CHANNEL });
    writeJson(response, HTTP_STATUS_UNAVAILABLE, { error: "unavailable" });
    return;
  }
  response.writeHead(HTTP_STATUS_NO_CONTENT, { "cache-control": "no-store" });
  response.end();
}

async function handleBoardEvents(
  response: ServerResponse,
  options: RealtimeServerOptions,
  url: URL,
): Promise<void> {
  const token = url.searchParams.get("token") ?? "";
  const nowSeconds = options.nowSeconds?.() ?? currentUnixSeconds();
  const verified = verifyRealtimeToken(
    token,
    options.jwtSecret,
    BOARD_CHANNEL,
    nowSeconds,
  );
  if (!verified.ok) {
    writeJson(response, HTTP_STATUS_UNAUTHORIZED, { error: "unauthorized" });
    return;
  }

  const stream = createBoardStream(response, options.heartbeatIntervalMs);
  try {
    const subscription = await options.openSubscription(BOARD_CHANNEL, () => {
      stream.sendInvalidate();
    });
    stream.attach(subscription);
  } catch {
    logError("subscribe_failed", { channel: BOARD_CHANNEL });
    stream.fail(HTTP_STATUS_UNAVAILABLE);
  }
}

function createBoardStream(response: ServerResponse, heartbeatMs?: number) {
  let subscription: Subscription | undefined;
  let cleaned = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const interval = heartbeatMs ?? HEARTBEAT_INTERVAL_MS;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timer) clearInterval(timer);
    const pending = subscription;
    subscription = undefined;
    void pending?.close().catch(() => {
      logError("unsubscribe_failed", { channel: BOARD_CHANNEL });
    });
  };

  response.on("close", cleanup);

  return {
    attach(next: Subscription) {
      if (cleaned || response.destroyed) {
        void next.close().catch(() => {
          logError("unsubscribe_failed", { channel: BOARD_CHANNEL });
        });
        return;
      }
      subscription = next;
      response.writeHead(HTTP_STATUS_OK, SSE_HEADERS);
      response.write(formatSseComment("connected"));
      timer = startHeartbeat(response, interval, () => cleaned, cleanup);
    },
    sendInvalidate() {
      if (cleaned || response.destroyed || response.writableEnded) return;
      const chunk = formatSseEvent(SSE_EVENT_NAME, { channel: BOARD_CHANNEL });
      response.write(chunk);
    },
    fail(status: number) {
      cleanup();
      if (!response.headersSent && !response.destroyed) {
        writeJson(response, status, { error: "unavailable" });
      }
    },
  };
}

function startHeartbeat(
  response: ServerResponse,
  intervalMs: number,
  isStopped: () => boolean,
  stop: () => void,
): ReturnType<typeof setInterval> {
  const timer = setInterval(() => {
    if (isStopped() || response.destroyed || response.writableEnded) {
      stop();
      return;
    }
    response.write(formatSseComment("heartbeat"));
  }, intervalMs);
  timer.unref();
  return timer;
}

function isBoardPublish(value: unknown): boolean {
  return isRecord(value) && value.channel === BOARD_CHANNEL;
}

async function readJsonBody(request: IncomingMessage): Promise<BodyResult> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_PUBLISH_BODY_BYTES) {
      return { ok: false, status: HTTP_STATUS_PAYLOAD_TOO_LARGE };
    }
    chunks.push(buffer);
  }
  try {
    const text = Buffer.concat(chunks).toString("utf8");
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: HTTP_STATUS_BAD_REQUEST };
  }
}

function writeJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    ...JSON_HEADERS,
    "content-length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function parseRequestUrl(raw: string | undefined): URL | undefined {
  try {
    return new URL(raw ?? "/", "http://127.0.0.1");
  } catch {
    return undefined;
  }
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function currentUnixSeconds(): number {
  return Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
}
