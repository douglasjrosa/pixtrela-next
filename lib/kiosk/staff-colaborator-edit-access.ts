import { getAppSession } from "@/lib/auth/app-session";
import type { Role } from "@/lib/auth/nav";
import { assertKioskStaffCanManageColaborator } from "@/lib/business/kiosk-staff-access";

/** Password/face of another person: kiosk device session only. */
export async function assertStaffColaboratorEditAccess(
  staffUserId: string,
  colaboratorDocumentId: string,
): Promise<void> {
  const session = await getAppSession();
  const role = session?.user?.role as Role | undefined;

  if (role !== "kiosk") {
    throw new Error("forbidden");
  }

  await assertKioskStaffCanManageColaborator(
    staffUserId,
    colaboratorDocumentId,
  );
}
