import type { KioskIdentifiedRole } from "@/lib/business/kiosk-identify-route";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { strapiFetch } from "@/lib/strapi";

interface KioskStaffUserResponse {
  documentId: string;
  role: KioskIdentifiedRole;
}

export async function loadKioskStaffUser(
  userId: string,
): Promise<KioskStaffUserResponse | null> {
  try {
    return await strapiFetch<KioskStaffUserResponse>(
      `/kiosk/staff/users/${userId}`,
      { strapiCache: { noStore: true } },
    );
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
