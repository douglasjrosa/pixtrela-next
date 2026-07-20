import { KioskStaffHome } from "@/components/kiosk/kiosk-staff-home";
import { canKioskSignOutDevice } from "@/lib/business/kiosk-staff-access";
import { loadKioskStaffUser } from "@/lib/kiosk/load-staff-user";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffPage({ params }: PageProps) {
  const { userId } = await params;
  const staffUser = await loadKioskStaffUser(userId);

  return (
    <KioskStaffHome
      userId={userId}
      canSignOut={canKioskSignOutDevice(staffUser?.role)}
    />
  );
}
