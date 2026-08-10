/**
 * Roles that may open an app session via code/tag/face identify.
 * Excludes device `kiosk` (username login only).
 */
export function canEstablishAppSession(
  role: string | null | undefined,
  blocked: boolean | undefined,
): boolean {
  if (blocked) return false;
  if (!role) return false;
  return (
    role === "colaborator" ||
    role === "admin" ||
    role === "manager" ||
    role === "leader"
  );
}
