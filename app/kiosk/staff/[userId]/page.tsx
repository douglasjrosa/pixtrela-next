import { notFound } from "next/navigation";

import { adjustKioskColaboratorBalance } from "@/app/kiosk/staff/[userId]/actions";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { StaffDashboardView } from "@/components/dashboard/staff-dashboard-view";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { loadColaboratorOptionsForStaff } from "@/lib/dashboard/load-colaborator-options-for-staff";

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ colaborator?: string }>;
}

export default async function KioskStaffPage({
  params,
  searchParams,
}: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  const { colaborator } = await searchParams;
  const colaboratorOptions = await loadColaboratorOptionsForStaff(
    actor.staffRole,
    actor.staffUserId,
  );

  return (
    <KioskContentSurface>
      <StaffDashboardView
        role={actor.staffRole}
        sessionUserId={actor.staffUserId}
        colaboratorParam={colaborator}
        colaboratorOptions={colaboratorOptions}
        onAdjustBalance={adjustKioskColaboratorBalance.bind(
          null,
          actor.staffUserId,
        )}
      />
    </KioskContentSurface>
  );
}
