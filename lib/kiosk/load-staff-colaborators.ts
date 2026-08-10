import type { KioskStaffColaboratorRow } from "@/components/kiosk/kiosk-staff-users-panel";
import { isDrizzleBackend } from "@/lib/db/backend";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  findUserFacePhotoUrl,
  listUsersByRole,
} from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { strapiFetch } from "@/lib/strapi";

interface StrapiList<T> {
  data: T[];
}

async function loadDrizzleStaffColaborators(): Promise<
  KioskStaffColaboratorRow[]
> {
  const users = await listUsersByRole("colaborator");
  const rows: KioskStaffColaboratorRow[] = [];
  for (const user of users) {
    if (!user.active || user.blocked) continue;
    const facePhotoUrl = await findUserFacePhotoUrl(user.id);
    rows.push({
      documentId: user.id,
      name: user.name,
      code: user.code,
      facePhotoUrl: facePhotoUrl ? toBrowserMediaUrl(facePhotoUrl) : null,
    });
  }
  return rows;
}

export async function loadKioskStaffColaborators(
  staffUserId: string,
): Promise<KioskStaffColaboratorRow[]> {
  if (isDrizzleBackend()) {
    try {
      return await loadDrizzleStaffColaborators();
    } catch (error) {
      rethrowIfNavigationError(error);
      return [];
    }
  }

  try {
    const res = await strapiFetch<StrapiList<KioskStaffColaboratorRow>>(
      `/kiosk/staff/users/${staffUserId}/colaborators`,
      { strapiCache: { noStore: true } },
    );
    return res.data.map((colaborator) => ({
      ...colaborator,
      facePhotoUrl: resolveStrapiMediaUrl(colaborator.facePhotoUrl ?? null),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
