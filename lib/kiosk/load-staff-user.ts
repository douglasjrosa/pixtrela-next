import type { KioskIdentifiedRole } from "@/lib/business/kiosk-identify-route";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { findUserById } from "@/lib/repos/users";

interface KioskStaffUserResponse {
  documentId: string;
  role: KioskIdentifiedRole;
}

const STAFF_ROLES = new Set<KioskIdentifiedRole>([
  "admin",
  "manager",
  "leader",
]);

export async function loadKioskStaffUser(
  userId: string,
): Promise<KioskStaffUserResponse | null> {
  try {
    const user = await findUserById(userId);
    if (!user || user.blocked || !user.active) return null;
    if (!STAFF_ROLES.has(user.role as KioskIdentifiedRole)) return null;
    return {
      documentId: user.id,
      role: user.role as KioskIdentifiedRole,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
