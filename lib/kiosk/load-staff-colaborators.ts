import type { KioskStaffColaboratorRow } from "@/components/kiosk/kiosk-staff-users-panel";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  findUserFacePhotoUrl,
  listUsersByRole,
} from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

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
  _staffUserId: string,
): Promise<KioskStaffColaboratorRow[]> {
  try {
    return await loadDrizzleStaffColaborators();
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
