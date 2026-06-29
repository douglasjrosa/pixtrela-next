import {
  KioskStaffUsersPanel,
} from "@/components/kiosk/kiosk-staff-users-panel";
import { canKioskSignOutDevice } from "@/lib/business/kiosk-staff-access";
import { loadKioskStaffColaborators } from "@/lib/kiosk/load-staff-colaborators";
import { loadKioskStaffUser } from "@/lib/kiosk/load-staff-user";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffUsersPage({ params }: PageProps) {
  const { userId } = await params;
  const [colaborators, staffUser] = await Promise.all([
    loadKioskStaffColaborators(userId),
    loadKioskStaffUser(userId),
  ]);

  return (
    <section className="p-6">
      <KioskStaffUsersPanel
        userId={userId}
        colaborators={colaborators}
        canSignOut={canKioskSignOutDevice(staffUser?.role)}
      />
    </section>
  );
}
