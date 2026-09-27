import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BOARD_REALTIME_CHANNEL,
  REALTIME_TOKEN_TTL_SECONDS,
} from "@/lib/realtime/board-channel";
import {
  issueBoardRealtimeCredentials,
  signBoardRealtimeToken,
} from "@/lib/realtime/realtime-token";

const JWT_SECRET = "jwt-secret";
const SSE_URL = "https://sse.example/";
const NOW_SECONDS = 1_700_000_000;

describe("issueBoardRealtimeCredentials", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when the JWT secret or SSE URL is missing", () => {
    vi.stubEnv("REALTIME_JWT_SECRET", "");
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", SSE_URL);

    expect(issueBoardRealtimeCredentials(NOW_SECONDS)).toBeNull();
  });

  it("signs a board-only channel token for the public SSE origin", () => {
    vi.stubEnv("REALTIME_JWT_SECRET", JWT_SECRET);
    vi.stubEnv("NEXT_PUBLIC_REALTIME_SSE_URL", SSE_URL);

    const credentials = issueBoardRealtimeCredentials(NOW_SECONDS);
    expect(credentials?.sseUrl).toBe("https://sse.example");

    const token = credentials?.token ?? "";
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    const unsigned = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac("sha256", JWT_SECRET)
      .update(unsigned)
      .digest("base64url");
    const payload = JSON.parse(
      Buffer.from(encodedPayload ?? "", "base64url").toString("utf8"),
    ) as { channels: string[]; exp: number; iat: number };

    expect(signature).toBe(expectedSignature);
    expect(payload.channels).toEqual([BOARD_REALTIME_CHANNEL]);
    expect(payload.exp).toBe(NOW_SECONDS + REALTIME_TOKEN_TTL_SECONDS);
    expect(token).toBe(signBoardRealtimeToken(JWT_SECRET, NOW_SECONDS));
  });
});
