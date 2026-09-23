import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ZodError } from "zod";

import { LOG_DETAIL_MAX_LENGTH } from "@/lib/logs/constants";

const SKIP_MESSAGES = new Set([
  "forbidden",
  "notFound",
  "not_found",
  "invalid",
]);

const SENSITIVE_KEY = /password|token|secret|authorization|passwd|apikey/i;

const TOKEN_PATTERN = /[^a-zA-Z0-9_.:-]/g;

const NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

const VALIDATION_CODE_MAX_LENGTH = 80;

export function sanitizeToken(value: string): string {
  return value.replace(TOKEN_PATTERN, "_").slice(0, VALIDATION_CODE_MAX_LENGTH);
}

export function isSensitiveLogKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "";
}

function errorDigest(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    return error.digest;
  }
  return "";
}

function isShortValidationCode(message: string): boolean {
  if (!message || message.length > VALIDATION_CODE_MAX_LENGTH) return false;
  if (/\s/.test(message)) return false;
  return true;
}

/** Validation, auth, and navigation failures are not audit bugs. */
export function isSkippableLogError(error: unknown): boolean {
  if (isRedirectError(error)) return true;
  if (error instanceof ZodError) return true;
  const digest = errorDigest(error);
  if (digest.includes(NOT_FOUND_DIGEST) || digest.startsWith("NEXT_REDIRECT")) {
    return true;
  }
  const message = errorMessage(error);
  if (SKIP_MESSAGES.has(message)) return true;
  if (message.endsWith("NotFound") || message.endsWith("not_found")) {
    return true;
  }
  if (isShortValidationCode(message)) return true;
  return false;
}

/** Short stable code. Never the stack, body, or a secret. */
export function logErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const message = error.message.trim();
  if (isShortValidationCode(message) && !isSensitiveLogKey(message)) {
    return sanitizeToken(message);
  }
  return sanitizeToken(error.name || "Error");
}

export function formatBugDetail(
  operation: string,
  code: string,
  ids?: Record<string, string | number | null | undefined>,
): string {
  const head = `${sanitizeToken(operation)}|${sanitizeToken(code)}`;
  const idPart = Object.entries(ids ?? {})
    .filter(([key]) => !isSensitiveLogKey(key))
    .map(([key, value]) => {
      const safeValue = value == null ? "" : sanitizeToken(String(value));
      return `${sanitizeToken(key)}=${safeValue}`;
    })
    .filter((part) => part.length > 0)
    .join(",");
  const detail = idPart ? `${head}|${idPart}` : head;
  return detail.slice(0, LOG_DETAIL_MAX_LENGTH);
}
