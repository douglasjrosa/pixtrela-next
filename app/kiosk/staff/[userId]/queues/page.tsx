import { notFound } from "next/navigation";

import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskStaffQueuesPanel } from "@/components/kiosk/kiosk-staff-queues-panel";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { loadStaffQueuesGrouped } from "@/lib/kiosk/load-staff-queues-grouped";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffQueuesPage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  const { teams } = await loadStaffQueuesGrouped(
    actor.staffUserId,
    actor.staffRole,
  );

  return (
    <KioskContentSurface>
      <KioskStaffQueuesPanel userId={userId} teams={teams} />
    </KioskContentSurface>
  );
}
