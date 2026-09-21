import { notFound } from "next/navigation";

import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { KioskQueueColaboratorPage } from "@/components/kiosk/kiosk-queue-colaborator-page";
import { assertKioskStaffCanManageColaborator } from "@/lib/business/kiosk-staff-access";
import { staffQueuesPath } from "@/lib/business/kiosk-staff-paths";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import { routeThemeContentSurfaceTopRadiusClass } from "@/lib/themes/match-route-theme";

interface PageProps {
  params: Promise<{ userId: string; colaboratorId: string }>;
}

export default async function KioskStaffQueueColaboratorPage({
  params,
}: PageProps) {
  const { userId, colaboratorId } = await params;

  try {
    await assertKioskStaffCanManageColaborator(userId, colaboratorId);
  } catch {
    notFound();
  }

  const themes = await loadRouteThemes();
  const kioskTheme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const toolbarTopRadiusClass =
    routeThemeContentSurfaceTopRadiusClass(kioskTheme);

  return (
    <KioskContentSurface>
      <KioskQueueColaboratorPage
        colaboratorId={colaboratorId}
        staffUserId={userId}
        allowFaceEdit
        backHref={staffQueuesPath(userId)}
        toolbarTopRadiusClass={toolbarTopRadiusClass}
        headerClassName="max-w-[min(100%,14rem)] shrink-0"
      />
    </KioskContentSurface>
  );
}
