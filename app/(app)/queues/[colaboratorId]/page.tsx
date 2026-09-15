import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { KioskPanelClient } from "@/app/kiosk/[colaboratorId]/kiosk-panel-client";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_CONTENT_HEIGHT_CLASS } from "@/components/layout/app-page-layout";
import { cn } from "@/lib/utils";
import { appQueuesPath } from "@/lib/business/app-queues-paths";
import { isKioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { loadKioskQueueSectionPage } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";
import { loadKioskLiveChainIntervalSeconds } from "@/lib/kiosk/load-session-idle";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import { findUserFacePhotoUrl } from "@/lib/repos/users";
import { DEFAULT_KIOSK_QUEUE_PAGE_SIZE } from "@/lib/schemas/kiosk-setting";
import type { Role } from "@/lib/auth/nav";
import { loadRouteThemes } from "@/lib/themes/load-route-themes";
import {
  matchRouteTheme,
  routeThemeContentSurfaceTopRadiusClass,
} from "@/lib/themes/match-route-theme";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
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

export default async function AppQueueColaboratorPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const staffUserId = session?.user?.id;

  if (!staffUserId || !isKioskStaffRole(role)) {
    return <ForbiddenMessage />;
  }

  const { colaboratorId } = await params;

  try {
    await assertStaffCanManageColaborator(staffUserId, colaboratorId);
  } catch {
    notFound();
  }

  const [liberadas, profile, facePhotoUrl, liveChainIntervalSeconds, themes] =
    await Promise.all([
      loadKioskQueueSectionPage({ colaboratorId, section: "liberadas" }),
      loadKioskColaboratorProfile(colaboratorId),
      findUserFacePhotoUrl(colaboratorId),
      loadKioskLiveChainIntervalSeconds(),
      loadRouteThemes(),
    ]);

  const toolbarTopRadiusClass = routeThemeContentSurfaceTopRadiusClass(
    matchRouteTheme("/queues", themes),
  );

  return (
    <section className={cn(APP_CONTENT_HEIGHT_CLASS, "flex flex-col")}>
      <KioskPanelClient
        colaboratorId={colaboratorId}
        colaboratorName={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl ?? null}
        facePhotoUrl={facePhotoUrl}
        initialLiberadas={liberadas ?? EMPTY_LIBERADAS}
        maxSimultaneousSubtaskIntervalSeconds={liveChainIntervalSeconds}
        staffUserId={staffUserId}
        allowFaceEdit
        backHref={appQueuesPath()}
        toolbarTopRadiusClass={toolbarTopRadiusClass}
      />
    </section>
  );
}
