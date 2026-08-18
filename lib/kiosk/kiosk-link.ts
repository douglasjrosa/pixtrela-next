export function buildKioskColaboratorPath(documentId: string): string {
  return `/kiosk/${documentId}`;
}

const KIOSK_SEGMENT = "kiosk";
const KIOSK_STAFF_SEGMENT = "staff";
const KIOSK_COLABORATOR_PATH_SEGMENTS = 2;

/** `/kiosk/{colaboratorId}` — not `/kiosk` or `/kiosk/staff/...`. */
export function isKioskColaboratorPanelPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return (
    parts.length === KIOSK_COLABORATOR_PATH_SEGMENTS &&
    parts[0] === KIOSK_SEGMENT &&
    parts[1] !== KIOSK_STAFF_SEGMENT
  );
}
