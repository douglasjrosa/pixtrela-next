import { timingSafeEqual } from "node:crypto";
import { BEARER_SCHEME } from "./constants.js";

export function isAuthorizedPublisher(
  authorization: string | undefined,
  secret: string,
): boolean {
  if (!secret || !authorization) return false;
  const trimmed = authorization.trim();
  if (trimmed.length <= BEARER_SCHEME.length) return false;
  const scheme = trimmed.slice(0, BEARER_SCHEME.length).toLowerCase();
  if (scheme !== BEARER_SCHEME) return false;
  const provided = trimmed.slice(BEARER_SCHEME.length).trim();
  return secretsMatch(provided, secret);
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  if (providedBytes.length !== expectedBytes.length) return false;
  return timingSafeEqual(providedBytes, expectedBytes);
}
