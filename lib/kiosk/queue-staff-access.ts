import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import { canPreviewKioskColaborator } from "@/lib/auth/permissions";
import { canAccessOwnProfile } from "@/lib/auth/profile-access";
import {
  assertKioskDeviceSession,
  assertKioskStaffCanOpenQueue,
  isKioskStaffRole,
} from "@/lib/business/kiosk-staff-access";
import { assertStaffCanOpenQueue } from "@/lib/repos/kiosk";

async function isOwnProducerQueue(colaboratorId: string): Promise<boolean> {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;
  return Boolean(
    session?.user?.id &&
      session.user.id === colaboratorId &&
      canAccessOwnProfile(role),
  );
}

/**
 * Queue mutations from the kiosk device (self-service), kiosk staff URL, or
 * web staff /queues routes.
 */
export async function assertQueueStaffMutation(
  colaboratorId: string,
  staffUserId?: string,
): Promise<void> {
  if (await isOwnProducerQueue(colaboratorId)) {
    return;
  }

  const ownSession = await getAppSession();
  const ownRole = ownSession?.user?.role as Role | undefined;
  if (canAccessOwnProfile(ownRole) && !staffUserId) {
    throw new Error("forbidden");
  }

  if (!staffUserId) {
    await assertKioskDeviceSession();
    return;
  }

  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;

  if (role === "kiosk") {
    await assertKioskStaffCanOpenQueue(staffUserId, colaboratorId);
    return;
  }

  if (session?.user?.id !== staffUserId || !isKioskStaffRole(role)) {
    throw new Error("forbidden");
  }

  await assertStaffCanOpenQueue(staffUserId, colaboratorId);
}

/** Read access for queue polling on kiosk, admin preview, or staff routes. */
export async function assertQueueReader(
  colaboratorId: string,
  staffUserId?: string,
): Promise<void> {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;

  if (await isOwnProducerQueue(colaboratorId)) {
    return;
  }

  if (role === "kiosk" || canPreviewKioskColaborator(role)) {
    return;
  }

  if (
    staffUserId &&
    session?.user?.id === staffUserId &&
    isKioskStaffRole(role)
  ) {
    await assertStaffCanOpenQueue(staffUserId, colaboratorId);
    return;
  }

  throw new Error("forbidden");
}
