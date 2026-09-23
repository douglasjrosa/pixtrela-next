import { isSkippableLogError } from "@/lib/logs/log-error";

type RequestInfo = {
  path: string;
  method: string;
};

type ErrorContext = {
  routePath: string;
  routeType: string;
};

/**
 * Unexpected request errors that no action catch recorded.
 * Validation, forbidden, and notFound stay out of the log.
 */
export async function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
): Promise<void> {
  if (isSkippableLogError(error)) return;
  try {
    const { auditBug } = await import("@/lib/logs/record-log");
    const route = context.routePath || request.path || "unknown";
    await auditBug({
      route,
      operation: context.routeType || request.method || "request",
      error,
    });
  } catch {
    return;
  }
}
