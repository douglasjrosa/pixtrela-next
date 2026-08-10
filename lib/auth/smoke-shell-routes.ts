import type { Role } from "@/lib/auth/nav";
import { navItemsForRole } from "@/lib/auth/nav";

/**
 * Authenticated shell routes to smoke per role.
 * Derived from nav (plus kiosk home). Dynamic IDs and deep flows stay out.
 * Hash fragments are stripped so Playwright navigates to real paths.
 */
export function smokeShellHrefsForRole(
  role: Role,
  userId?: string,
): string[] {
  if (role === "kiosk") return ["/kiosk"];
  const hrefs = navItemsForRole(role, { userId }).map(
    (item) => item.href.split("#")[0] ?? item.href,
  );
  return [...new Set(hrefs)];
}
