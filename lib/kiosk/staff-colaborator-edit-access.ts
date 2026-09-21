import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import {
  assertKioskStaffCanManageColaborator,
  isKioskStaffRole,
} from "@/lib/business/kiosk-staff-access";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";

/** Password/face edit from kiosk staff URL or web /queues staff routes. */
export async function assertStaffColaboratorEditAccess(
  staffUserId: string,
  colaboratorDocumentId: string,
): Promise<void> {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;

  if (role === "kiosk") {
    await assertKioskStaffCanManageColaborator(
      staffUserId,
      colaboratorDocumentId,
    );
    return;
  }

  if (session?.user?.id !== staffUserId || !isKioskStaffRole(role)) {
    throw new Error("forbidden");
  }

  await assertStaffCanManageColaborator(staffUserId, colaboratorDocumentId);
}
