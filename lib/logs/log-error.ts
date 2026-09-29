import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ZodError } from "zod";

import { KIOSK_ACTION_ERROR_CODES } from "@/lib/business/kiosk-action-error";
import { LOG_DETAIL_MAX_LENGTH } from "@/lib/logs/constants";

const SKIP_MESSAGES = new Set<string>([
  "forbidden",
  "notFound",
  "not_found",
  "invalid",
  "invalid_link",
  ...KIOSK_ACTION_ERROR_CODES,
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
  return false;
}

const SECRET_ASSIGNMENT =
  /(password|token|secret|authorization|apikey)\s*[:=]\s*\S+/gi;

const ERROR_SUMMARY_MAX_LENGTH = 240;

/** Readable cause for operators. Secrets are redacted; stacks stay out. */
export function logErrorSummary(error: unknown): string {
  const raw = error instanceof Error ? error.message : "";
  const text = raw.trim().length > 0 ? raw : "unknown_error";
  return text
    .replace(SECRET_ASSIGNMENT, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ERROR_SUMMARY_MAX_LENGTH);
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
  message?: string,
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
  const summary = message?.replace(/\s+/g, " ").trim() ?? "";
  const withMessage = summary.length > 0 ? `${detail}|${summary}` : detail;
  return withMessage.slice(0, LOG_DETAIL_MAX_LENGTH);
}
