import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { strapiFetch } from "@/lib/strapi";

import type { KioskStaffColaboratorRow } from "@/components/kiosk/kiosk-staff-users-panel";

interface StrapiList<T> {
  data: T[];
}

export async function loadKioskStaffColaborators(
  staffUserId: string,
): Promise<KioskStaffColaboratorRow[]> {
  try {
    const res = await strapiFetch<StrapiList<KioskStaffColaboratorRow>>(
      `/kiosk/staff/users/${staffUserId}/colaborators`,
      { strapiCache: { noStore: true } },
    );
    return res.data;
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
