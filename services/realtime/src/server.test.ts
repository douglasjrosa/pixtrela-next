import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { BOARD_CHANNEL, PUBLISH_MESSAGE } from "./constants.js";
import { signRealtimeToken } from "./jwt.js";
import {
  createRealtimeServer,
  type RealtimeServerOptions,
} from "./server.js";

const PUBLISH_SECRET = "abcdef0123456789abcdef0123456789";
const JWT_SECRET = "0123456789abcdef0123456789abcdef";
const ISSUED_AT_SECONDS = 1_700_000_000;
const WAIT_TIMEOUT_MS = 2_000;

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.closeAllConnections();
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

type FakeHub = {
  publishes: Array<{ channel: string; message: string }>;
  subscribed: string[];
  closed: string[];
};

function createFakeHub(): FakeHub {
  return { publishes: [], subscribed: [], closed: [] };
}

function createOptions(
  hub: FakeHub,
  overrides: Partial<RealtimeServerOptions> = {},
): RealtimeServerOptions {
  return {
    publishSecret: PUBLISH_SECRET,
    jwtSecret: JWT_SECRET,
    nowSeconds: () => ISSUED_AT_SECONDS + 1,
    publish: async (channel, message) => {
      hub.publishes.push({ channel, message });
    },
    openSubscription: async (channel) => {
      hub.subscribed.push(channel);
      return {
        close: async () => {
          hub.closed.push(channel);
        },
      };
    },
    ...overrides,
  };
}

async function listen(options: RealtimeServerOptions): Promise<string> {
  const server = createRealtimeServer(options);
  servers.push(server);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP port.");
  }
  return `http://127.0.0.1:${address.port}`;
}

function boardToken(channels: string[] = [BOARD_CHANNEL]): string {
  return signRealtimeToken(
    { channels, ttlSeconds: 60 },
    JWT_SECRET,
    ISSUED_AT_SECONDS,
  );
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > WAIT_TIMEOUT_MS) {
      throw new Error("Timed out waiting for realtime condition.");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("realtime HTTP routes", () => {
  it("answers GET /health without touching the hub", async () => {
    const hub = createFakeHub();
    const baseUrl = await listen(createOptions(hub));

    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(hub.publishes).toHaveLength(0);
    expect(hub.subscribed).toHaveLength(0);
  });

  it("rejects publish calls that fail bearer auth", async () => {
    const hub = createFakeHub();
    const baseUrl = await listen(createOptions(hub));

    const missing = await fetch(`${baseUrl}/internal/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: BOARD_CHANNEL }),
    });
    const wrong = await fetch(`${baseUrl}/internal/publish`, {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret-value-32-chars-xxxx",
        "content-type": "application/json",
      },
      body: JSON.stringify({ channel: BOARD_CHANNEL }),
    });

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(hub.publishes).toHaveLength(0);
  });

  it("publishes the board channel and nothing else", async () => {
    const hub = createFakeHub();
    const baseUrl = await listen(createOptions(hub));

    const ok = await fetch(`${baseUrl}/internal/publish`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${PUBLISH_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ channel: BOARD_CHANNEL }),
    });
    const rejected = await fetch(`${baseUrl}/internal/publish`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${PUBLISH_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ channel: "tasks" }),
    });

    expect(ok.status).toBe(204);
    expect(rejected.status).toBe(400);
    expect(hub.publishes).toEqual([
      { channel: BOARD_CHANNEL, message: PUBLISH_MESSAGE },
    ]);
  });

  it("does not subscribe when the board token is invalid", async () => {
    const hub = createFakeHub();
    const baseUrl = await listen(createOptions(hub));
    const tasksToken = boardToken(["tasks"]);

    const missing = await fetch(`${baseUrl}/events/board`);
    const foreign = await fetch(`${baseUrl}/events/board?token=${tasksToken}`);

    expect(missing.status).toBe(401);
    expect(foreign.status).toBe(401);
    expect(hub.subscribed).toHaveLength(0);
  });

  it("streams board-invalidate and closes the subscriber on abort", async () => {
    const hub = createFakeHub();
    let deliver: ((message: string) => void) | undefined;
    const baseUrl = await listen(
      createOptions(hub, {
        openSubscription: async (channel, onMessage) => {
          hub.subscribed.push(channel);
          deliver = onMessage;
          return {
            close: async () => {
              hub.closed.push(channel);
            },
          };
        },
      }),
    );
    const token = boardToken();

    const response = await fetch(`${baseUrl}/events/board?token=${encodeURIComponent(token)}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Expected an SSE body.");

    deliver?.(PUBLISH_MESSAGE);
    const chunk = await readUntil(reader, "board-invalidate");
    expect(chunk).toContain("event: board-invalidate");
    expect(chunk).toContain('data: {"channel":"board"}');

    await reader.cancel();
    await waitFor(() => hub.closed.includes(BOARD_CHANNEL));
  });
});

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  needle: string,
): Promise<string> {
  const decoder = new TextDecoder();
  let text = "";
  const started = Date.now();
  while (!text.includes(needle)) {
    if (Date.now() - started > WAIT_TIMEOUT_MS) {
      throw new Error(`Timed out reading SSE. Saw: ${text}`);
    }
    const next = await reader.read();
    if (next.done) break;
    text += decoder.decode(next.value, { stream: true });
  }
  return text;
}
