/**
 * Next.js Server Action POSTs send a `Next-Action` header and expect an RSC
 * flight body. Middleware redirects turn into HTML (or a followed 307) and the
 * client throws "An unexpected response was received from the server."
 */
export function isServerActionRequest(request: {
  method: string;
  headers: { get(name: string): string | null };
}): boolean {
  if (request.method !== "POST") return false;
  return Boolean(request.headers.get("next-action"));
}
