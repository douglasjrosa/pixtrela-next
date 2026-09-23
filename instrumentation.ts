type RequestInfo = {
  path: string;
  method: string;
};

type ErrorContext = {
  routePath: string;
  routeType: string;
};

/**
 * Edge instrumentation must stay free of Node modules.
 * Request logging runs only on the Node.js runtime.
 */
export async function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { onRequestError } = await import("./instrumentation.node.ts");
    await onRequestError(error, request, context);
  }
}
