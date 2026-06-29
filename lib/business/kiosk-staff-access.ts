import type { Role } from "@/lib/auth/nav";

import type { KioskIdentifiedRole } from "./kiosk-identify-route";

/** Admin and manager may sign out the kiosk device from the totem staff area. */
export function canKioskSignOutDevice(
  role: KioskIdentifiedRole | Role | undefined,
): boolean {
  return role === "admin" || role === "manager";
}
