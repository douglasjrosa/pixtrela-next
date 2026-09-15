import type { Role } from "@/lib/auth/nav";
import { isKioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { loadStaffQueuesGrouped } from "@/lib/kiosk/load-staff-queues-grouped";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listUsersByRole } from "@/lib/repos/users";

import type { ColaboratorOption } from "./types";

async function loadLeaderColaboratorOptions(
  staffUserId: string,
): Promise<ColaboratorOption[]> {
  const { teams } = await loadStaffQueuesGrouped(staffUserId, "leader");
  const byId = new Map<string, ColaboratorOption>();
  for (const team of teams) {
    for (const member of team.members) {
      byId.set(member.documentId, {
        documentId: member.documentId,
        name: member.name,
        code: member.code,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadAllActiveColaboratorOptions(): Promise<ColaboratorOption[]> {
  const users = await listUsersByRole("colaborator");
  return users
    .filter((user) => user.active && !user.blocked)
    .map((user) => ({
      documentId: user.id,
      name: user.name,
      code: user.code,
    }));
}

/**
 * Colaborator options for the kiosk staff dashboard. Leaders see only members
 * of the teams they lead; manager+ see all active colaborators.
 */
export async function loadColaboratorOptionsForStaff(
  role: Role | undefined,
  staffUserId: string,
): Promise<ColaboratorOption[]> {
  if (!isKioskStaffRole(role)) {
    return [];
  }

  try {
    if (role === "leader") {
      return await loadLeaderColaboratorOptions(staffUserId);
    }
    return await loadAllActiveColaboratorOptions();
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
