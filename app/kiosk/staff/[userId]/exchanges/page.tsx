import { notFound } from "next/navigation";

import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskStaffWebHint } from "@/components/kiosk/kiosk-staff-web-hint";
import { loadKioskStaffActor } from "@/lib/business/kiosk-staff-access";
import { canViewExchanges } from "@/lib/auth/permissions";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function KioskStaffExchangesPage({ params }: PageProps) {
  const { userId } = await params;
  const actor = await loadKioskStaffActor(userId);
  if (!actor) notFound();

  if (!canViewExchanges(actor.staffRole)) {
    return <ForbiddenMessage />;
  }

  return (
    <KioskContentSurface>
      <KioskStaffWebHint />
    </KioskContentSurface>
  );
}
