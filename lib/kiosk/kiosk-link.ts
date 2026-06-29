export function buildKioskColaboratorPath(documentId: string): string {
  return `/kiosk/${documentId}`;
}

export function buildKioskColaboratorUrl(
  documentId: string,
  origin: string,
): string {
  return `${origin}${buildKioskColaboratorPath(documentId)}`;
}

export async function copyKioskColaboratorLink(
  documentId: string,
  origin: string,
): Promise<void> {
  await navigator.clipboard.writeText(
    buildKioskColaboratorUrl(documentId, origin),
  );
}
