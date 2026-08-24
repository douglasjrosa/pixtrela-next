/** Builds the colaborator orders list route. */
export function buildOrdersPath(documentId: string): string {
  return `/${documentId}/orders`;
}

export function buildOrderPath(documentId: string, orderId: string): string {
  return `/${documentId}/orders/${orderId}`;
}

export function isUserOrdersPath(
  pathname: string,
  reservedSegments: ReadonlySet<string>,
): boolean {
  if (!pathname.startsWith("/")) return false;
  const parts = pathname.slice(1).split("/").filter(Boolean);
  if (parts.length < 2 || parts[1] !== "orders") return false;
  const documentId = parts[0];
  if (!documentId || reservedSegments.has(documentId)) return false;
  if (parts.length === 2) return true;
  return parts.length === 3 && Boolean(parts[2]);
}
