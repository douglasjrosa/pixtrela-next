/** Builds the colaborator store route for a user document id. */
export function buildStorePath(documentId: string): string {
  return `/${documentId}/store`;
}

/** True for `/{documentId}/store` (documentId not a reserved app segment). */
export function isUserStorePath(
  pathname: string,
  reservedSegments: ReadonlySet<string>,
): boolean {
  if (!pathname.startsWith("/")) return false;
  const parts = pathname.slice(1).split("/");
  if (parts.length !== 2 || parts[1] !== "store") return false;
  const documentId = parts[0];
  if (!documentId) return false;
  return !reservedSegments.has(documentId);
}
