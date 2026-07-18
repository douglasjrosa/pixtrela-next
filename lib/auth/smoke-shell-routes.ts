import type { Role } from "@/lib/auth/nav";
import { navItemsForRole } from "@/lib/auth/nav";

/**
 * Authenticated shell routes to smoke per role.
 * Derived from nav (plus kiosk home). Dynamic IDs and deep flows stay out.
 */
export function smokeShellHrefsForRole(role: Role): string[] {
  if (role === "kiosk") return ["/kiosk"];
  return navItemsForRole(role).map((item) => item.href);
}
