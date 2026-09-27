/** Builds the personal totem queue route for a user document id. */
export function buildUserKioskPath(documentId: string): string {
  return `/${documentId}/kiosk`;
}

/** True for `/{documentId}/kiosk` (documentId not a reserved app segment). */
export function isUserKioskPath(
  pathname: string,
  reservedSegments: ReadonlySet<string>,
): boolean {
  if (!pathname.startsWith("/")) return false;
  const parts = pathname.slice(1).split("/");
  if (parts.length !== 2 || parts[1] !== "kiosk") return false;
  const documentId = parts[0];
  if (!documentId) return false;
  return !reservedSegments.has(documentId);
}
