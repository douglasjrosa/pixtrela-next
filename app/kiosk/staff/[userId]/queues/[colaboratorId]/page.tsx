import { notFound } from "next/navigation";
import { KioskPanelClient } from "@/app/kiosk/[colaboratorId]/kiosk-panel-client";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import { assertKioskStaffCanManageColaborator } from "@/lib/business/kiosk-staff-access";
import { staffQueuesPath } from "@/lib/business/kiosk-staff-paths";
import { loadKioskQueueSectionPage } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import { findUserFacePhotoUrl } from "@/lib/repos/users";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import { DEFAULT_KIOSK_QUEUE_PAGE_SIZE } from "@/lib/schemas/kiosk-setting";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import { routeThemeContentSurfaceTopRadiusClass } from "@/lib/themes/match-route-theme";

interface PageProps {
  params: Promise<{ userId: string; colaboratorId: string }>;
}

const EMPTY_LIBERADAS: KioskQueueSectionPage = {
  section: "liberadas",
  producingUnits: [],
  units: [],
  nextCursor: null,
  hasMore: false,
  openRuns: [],
  subTasks: [],
  catalog: [],
  queuePageSize: DEFAULT_KIOSK_QUEUE_PAGE_SIZE,
};

export default async function KioskStaffQueueColaboratorPage({
  params,
}: PageProps) {
  const { userId, colaboratorId } = await params;

  try {
    await assertKioskStaffCanManageColaborator(userId, colaboratorId);
  } catch {
    notFound();
  }

  const kioskSettings = await loadKioskSettings();

  const [liberadas, profile, facePhotoUrl, themes] = await Promise.all([
    loadKioskQueueSectionPage({
      colaboratorId,
      section: "liberadas",
      liveChainIntervalSeconds:
        kioskSettings.maxSimultaneousSubtaskIntervalSeconds,
      queuePageSize: kioskSettings.queuePageSize,
    }),
    loadKioskColaboratorProfile(colaboratorId),
    findUserFacePhotoUrl(colaboratorId),
    loadRouteThemes(),
  ]);

  const kioskTheme = themes.find((entry) => entry.routeKey === "kiosk") ?? null;
  const toolbarTopRadiusClass =
    routeThemeContentSurfaceTopRadiusClass(kioskTheme);

  return (
    <KioskContentSurface>
      <KioskPanelClient
        colaboratorId={colaboratorId}
        colaboratorName={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl ?? null}
        facePhotoUrl={facePhotoUrl}
        initialLiberadas={liberadas ?? EMPTY_LIBERADAS}
        maxSimultaneousSubtaskIntervalSeconds={
          kioskSettings.maxSimultaneousSubtaskIntervalSeconds
        }
        staffUserId={userId}
        allowFaceEdit
        backHref={staffQueuesPath(userId)}
        toolbarTopRadiusClass={toolbarTopRadiusClass}
      />
    </KioskContentSurface>
  );
}
