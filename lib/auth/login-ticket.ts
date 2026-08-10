import { createHmac, timingSafeEqual } from "node:crypto";

const TICKET_VERSION = "v1";
const TICKET_TTL_MS = 60_000;
const PARTS_COUNT = 4;

function authSecret(): string {
  const value = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET is required for login tickets");
  }
  return value;
}

function signPayload(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

/**
 * Short-lived HMAC ticket so identify (code/tag/face) can establish an Auth.js
 * session without returning a Strapi JWT or re-sending the password.
 */
export function issueLoginTicket(userId: string, nowMs = Date.now()): string {
  const expiresAt = String(nowMs + TICKET_TTL_MS);
  const payload = `${TICKET_VERSION}.${userId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyLoginTicket(
  ticket: string,
  nowMs = Date.now(),
): string | null {
  const parts = ticket.split(".");
  if (parts.length !== PARTS_COUNT) return null;
  const [version, userId, expiresAt, signature] = parts;
  if (version !== TICKET_VERSION || !userId || !expiresAt || !signature) {
    return null;
  }
  const expiresMs = Number(expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs < nowMs) return null;

  const payload = `${version}.${userId}.${expiresAt}`;
  const expected = signPayload(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  return userId;
}
