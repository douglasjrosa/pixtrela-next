import { createHmac, timingSafeEqual } from "node:crypto";
import {
  JWT_ALGORITHM,
  JWT_CLOCK_SKEW_SECONDS,
  JWT_MAX_TTL_SECONDS,
  MAX_TOKEN_LENGTH,
} from "./constants.js";
import { isRecord } from "./records.js";

export type TokenFailure =
  | "malformed"
  | "algorithm"
  | "signature"
  | "claims"
  | "expired"
  | "ttl"
  | "channel";

export type VerifiedToken = {
  ok: true;
  channels: string[];
};

export type RejectedToken = {
  ok: false;
  reason: TokenFailure;
};

type TokenClaims = {
  channels: string[];
  iat: number;
  exp: number;
};

const JWT_SEGMENT_COUNT = 3;

export function signRealtimeToken(
  input: { channels: string[]; ttlSeconds: number },
  secret: string,
  nowSeconds: number,
): string {
  if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds < 1) {
    throw new Error("Token TTL exceeds the allowed window.");
  }
  if (input.ttlSeconds > JWT_MAX_TTL_SECONDS) {
    throw new Error("Token TTL exceeds the allowed window.");
  }
  const header = encodeJson({ alg: JWT_ALGORITHM, typ: "JWT" });
  const payload = encodeJson({
    channels: input.channels,
    iat: nowSeconds,
    exp: nowSeconds + input.ttlSeconds,
  });
  const signature = hmacSign(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}

export function verifyRealtimeToken(
  token: string,
  secret: string,
  requiredChannel: string,
  nowSeconds: number,
): VerifiedToken | RejectedToken {
  if (!secret || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== JWT_SEGMENT_COUNT) {
    return { ok: false, reason: "malformed" };
  }
  const [headerSegment, payloadSegment, signatureSegment] = parts;
  if (!headerSegment || !payloadSegment || signatureSegment === undefined) {
    return { ok: false, reason: "malformed" };
  }
  const header = parseJson(headerSegment);
  if (!isRecord(header)) return { ok: false, reason: "malformed" };
  if (header.alg !== JWT_ALGORITHM) return { ok: false, reason: "algorithm" };

  const expected = hmacSign(`${headerSegment}.${payloadSegment}`, secret);
  if (!signaturesMatch(signatureSegment, expected)) {
    return { ok: false, reason: "signature" };
  }

  const claims = readClaims(parseJson(payloadSegment));
  if (!claims) return { ok: false, reason: "claims" };
  const lifetime = claims.exp - claims.iat;
  if (lifetime < 1 || lifetime > JWT_MAX_TTL_SECONDS) {
    return { ok: false, reason: "ttl" };
  }
  if (claims.iat > nowSeconds + JWT_CLOCK_SKEW_SECONDS) {
    return { ok: false, reason: "claims" };
  }
  if (claims.exp <= nowSeconds) return { ok: false, reason: "expired" };
  if (!claims.channels.includes(requiredChannel)) {
    return { ok: false, reason: "channel" };
  }
  return { ok: true, channels: claims.channels };
}

function readClaims(value: unknown): TokenClaims | undefined {
  if (!isRecord(value)) return undefined;
  const { channels, iat, exp } = value;
  if (!isStringArray(channels)) return undefined;
  if (typeof iat !== "number" || typeof exp !== "number") return undefined;
  if (!Number.isInteger(iat) || !Number.isInteger(exp)) return undefined;
  return { channels, iat, exp };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function parseJson(segment: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
}

function hmacSign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(actualBytes, expectedBytes);
}
