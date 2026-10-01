export const PG_UNIQUE_VIOLATION = "23505";

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if (!("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

/** True for Postgres unique_violation, including Drizzle-wrapped causes. */
export function isUniqueViolation(error: unknown): boolean {
  if (errorCode(error) === PG_UNIQUE_VIOLATION) return true;
  if (error && typeof error === "object" && "cause" in error) {
    return isUniqueViolation(error.cause);
  }
  return false;
}
