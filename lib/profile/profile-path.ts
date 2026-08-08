/** Builds the own-profile route for a user document id. */
export function buildProfilePath(documentId: string): string {
  return `/${documentId}/profile`;
}

/** True for `/{documentId}/profile` (documentId not a reserved app segment). */
export function isUserProfilePath(
  pathname: string,
  reservedSegments: ReadonlySet<string>,
): boolean {
  if (!pathname.startsWith("/")) return false;
  const parts = pathname.slice(1).split("/");
  if (parts.length !== 2 || parts[1] !== "profile") return false;
  const documentId = parts[0];
  if (!documentId) return false;
  return !reservedSegments.has(documentId);
}
