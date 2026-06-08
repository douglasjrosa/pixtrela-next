import { isRedirectError } from "next/dist/client/components/redirect-error";

/** Re-throws Next.js redirect/notFound errors swallowed by catch blocks. */
export function rethrowIfNavigationError(error: unknown): void {
  if (isRedirectError(error)) {
    throw error;
  }
}
