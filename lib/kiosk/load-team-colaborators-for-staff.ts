import type { KioskStaffColaboratorRow } from "@/components/kiosk/kiosk-staff-users-panel";
import type { KioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { getDb, type Db } from "@/lib/db/client";
import { loadStaffQueuesGrouped } from "@/lib/kiosk/load-staff-queues-grouped";
import { mergeStaffSelfIntoCredentialList } from "@/lib/kiosk/staff-credential-list";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  findUserById,
  findUserFacePhotoUrl,
  listUsersByRole,
} from "@/lib/repos/users";

async function toStaffRow(
  userId: string,
  db: Db,
): Promise<KioskStaffColaboratorRow | null> {
  const user = await findUserById(userId, db);
  if (!user || !user.active || user.blocked) return null;
  const facePhotoUrl = await findUserFacePhotoUrl(user.id, db);
  return {
    documentId: user.id,
    name: user.name,
    code: user.code,
    facePhotoUrl: facePhotoUrl ? toBrowserMediaUrl(facePhotoUrl) : null,
  };
}

async function loadScopedColaborators(
  staffUserId: string,
  role: KioskStaffRole,
): Promise<KioskStaffColaboratorRow[]> {
  if (role === "leader") {
    const { teams } = await loadStaffQueuesGrouped(staffUserId, role);
    const byId = new Map<string, KioskStaffColaboratorRow>();
    for (const team of teams) {
      for (const member of team.members) {
        if (member.isLeader) continue;
        byId.set(member.documentId, {
          documentId: member.documentId,
          name: member.name,
          code: member.code,
          facePhotoUrl: member.facePhotoUrl ?? null,
        });
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

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

export async function loadTeamColaboratorsForStaff(
  staffUserId: string,
  role: KioskStaffRole,
  db: Db = getDb(),
): Promise<KioskStaffColaboratorRow[]> {
  try {
    const colaborators = await loadScopedColaborators(staffUserId, role);
    const staff = await toStaffRow(staffUserId, db);
    return mergeStaffSelfIntoCredentialList(colaborators, staff);
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
