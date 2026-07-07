export function buildKioskColaboratorPath(documentId: string): string {
  return `/kiosk/${documentId}`;
}

export function buildKioskColaboratorUrl(
  documentId: string,
  origin: string,
): string {
  return `${origin}${buildKioskColaboratorPath(documentId)}`;
}
