import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { BOARD_CHANNEL, JWT_MAX_TTL_SECONDS } from "./constants.js";
import { signRealtimeToken, verifyRealtimeToken } from "./jwt.js";

const JWT_SECRET = "0123456789abcdef0123456789abcdef";
const ISSUED_AT_SECONDS = 1_700_000_000;

function craftToken(
  payload: Record<string, unknown>,
  secret: string,
  alg = "HS256",
): string {
  const header = Buffer.from(JSON.stringify({ alg, typ: "JWT" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

describe("verifyRealtimeToken", () => {
  it("accepts an HS256 token whose channels include board", () => {
    const token = signRealtimeToken(
      { channels: [BOARD_CHANNEL], ttlSeconds: 60 },
      JWT_SECRET,
      ISSUED_AT_SECONDS,
    );

    const result = verifyRealtimeToken(
      token,
      JWT_SECRET,
      BOARD_CHANNEL,
      ISSUED_AT_SECONDS + 1,
    );

    expect(result).toEqual({ ok: true, channels: [BOARD_CHANNEL] });
  });

  it("rejects a missing or tampered signature", () => {
    const token = signRealtimeToken(
      { channels: [BOARD_CHANNEL], ttlSeconds: 60 },
      JWT_SECRET,
      ISSUED_AT_SECONDS,
    );
    const tampered = `${token.slice(0, -1)}x`;

    expect(
      verifyRealtimeToken(tampered, JWT_SECRET, BOARD_CHANNEL, ISSUED_AT_SECONDS),
    ).toEqual({ ok: false, reason: "signature" });
    expect(
      verifyRealtimeToken("not-a-jwt", JWT_SECRET, BOARD_CHANNEL, ISSUED_AT_SECONDS),
    ).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects the none algorithm", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url",
    );
    const body = Buffer.from(
      JSON.stringify({
        channels: [BOARD_CHANNEL],
        iat: ISSUED_AT_SECONDS,
        exp: ISSUED_AT_SECONDS + 60,
      }),
    ).toString("base64url");
    const token = `${header}.${body}.`;

    expect(
      verifyRealtimeToken(token, JWT_SECRET, BOARD_CHANNEL, ISSUED_AT_SECONDS),
    ).toEqual({ ok: false, reason: "algorithm" });
  });

  it("rejects a token that does not include the board channel", () => {
    const token = signRealtimeToken(
      { channels: ["tasks"], ttlSeconds: 60 },
      JWT_SECRET,
      ISSUED_AT_SECONDS,
    );

    expect(
      verifyRealtimeToken(token, JWT_SECRET, BOARD_CHANNEL, ISSUED_AT_SECONDS),
    ).toEqual({ ok: false, reason: "channel" });
  });

  it("rejects an expired token", () => {
    const token = signRealtimeToken(
      { channels: [BOARD_CHANNEL], ttlSeconds: 60 },
      JWT_SECRET,
      ISSUED_AT_SECONDS,
    );

    expect(
      verifyRealtimeToken(
        token,
        JWT_SECRET,
        BOARD_CHANNEL,
        ISSUED_AT_SECONDS + 60,
      ),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a lifetime longer than the short TTL cap", () => {
    const token = craftToken(
      {
        channels: [BOARD_CHANNEL],
        iat: ISSUED_AT_SECONDS,
        exp: ISSUED_AT_SECONDS + JWT_MAX_TTL_SECONDS + 1,
      },
      JWT_SECRET,
    );

    expect(
      verifyRealtimeToken(token, JWT_SECRET, BOARD_CHANNEL, ISSUED_AT_SECONDS),
    ).toEqual({ ok: false, reason: "ttl" });
  });

  it("refuses to sign a token longer than the TTL cap", () => {
    expect(() =>
      signRealtimeToken(
        { channels: [BOARD_CHANNEL], ttlSeconds: JWT_MAX_TTL_SECONDS + 1 },
        JWT_SECRET,
        ISSUED_AT_SECONDS,
      ),
    ).toThrow(/TTL/);
  });
});
