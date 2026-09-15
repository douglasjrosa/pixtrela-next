import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canPreviewKioskColaborator } from "@/lib/auth/permissions";
import {
  assertKioskStaffCanManageColaborator,
  isKioskStaffRole,
} from "@/lib/business/kiosk-staff-access";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";

async function assertKioskDeviceSession(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    throw new Error("forbidden");
  }
}

/**
 * Queue mutations from the kiosk device (self-service), kiosk staff URL, or
 * web staff /queues routes.
 */
export async function assertQueueStaffMutation(
  colaboratorId: string,
  staffUserId?: string,
): Promise<void> {
  if (!staffUserId) {
    await assertKioskDeviceSession();
    return;
  }

  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (role === "kiosk") {
    await assertKioskStaffCanManageColaborator(staffUserId, colaboratorId);
    return;
  }

  if (session?.user?.id !== staffUserId || !isKioskStaffRole(role)) {
    throw new Error("forbidden");
  }

  await assertStaffCanManageColaborator(staffUserId, colaboratorId);
}

/** Read access for queue polling on kiosk, admin preview, or staff routes. */
export async function assertQueueReader(
  colaboratorId: string,
  staffUserId?: string,
): Promise<void> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (role === "kiosk" || canPreviewKioskColaborator(role)) {
    return;
  }

  if (
    staffUserId &&
    session?.user?.id === staffUserId &&
    isKioskStaffRole(role)
  ) {
    await assertStaffCanManageColaborator(staffUserId, colaboratorId);
    return;
  }

  throw new Error("forbidden");
}
