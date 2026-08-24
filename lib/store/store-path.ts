/** Builds the colaborator store route for a user document id. */
export function buildStorePath(documentId: string): string {
  return `/${documentId}/store`;
}

/** Next.js dynamic path for revalidating every colaborator store page. */
export const COLABORATOR_STORE_PAGE_PATH = "/[documentId]/store";

/**
 * True for `/{documentId}/store` only (no nested cart/orders).
 */
export function isUserStorePath(
  pathname: string,
  reservedSegments: ReadonlySet<string>,
): boolean {
  if (!pathname.startsWith("/")) return false;
  const parts = pathname.slice(1).split("/").filter(Boolean);
  if (parts.length !== 2 || parts[1] !== "store") return false;
  const documentId = parts[0];
  if (!documentId || reservedSegments.has(documentId)) return false;
  return true;
}
