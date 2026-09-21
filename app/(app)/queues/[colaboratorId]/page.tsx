import { notFound } from "next/navigation";

import { KioskPanelClient } from "@/app/kiosk/[colaboratorId]/kiosk-panel-client";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_CONTENT_HEIGHT_CLASS } from "@/components/layout/app-page-layout";
import { cn } from "@/lib/utils";
import { appQueuesPath } from "@/lib/business/app-queues-paths";
import { isKioskStaffRole } from "@/lib/business/kiosk-staff-access";
import { getAppSession } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/nav";
import { loadKioskQueueSectionPage } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import { findUserFacePhotoUrl } from "@/lib/repos/users";
import { DEFAULT_KIOSK_QUEUE_PAGE_SIZE } from "@/lib/schemas/kiosk-setting";
import { loadQueuesToolbarTopRadiusClass } from "@/lib/themes/load-queues-route-toolbar";

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
  const session = await getAppSession();
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

  const kioskSettings = await loadKioskSettings();

  const [liberadas, profile, facePhotoUrl, toolbarTopRadiusClass] =
    await Promise.all([
      loadKioskQueueSectionPage({
        colaboratorId,
        section: "liberadas",
        liveChainIntervalSeconds:
          kioskSettings.maxSimultaneousSubtaskIntervalSeconds,
        queuePageSize: kioskSettings.queuePageSize,
      }),
      loadKioskColaboratorProfile(colaboratorId),
      findUserFacePhotoUrl(colaboratorId),
      loadQueuesToolbarTopRadiusClass(),
    ]);

  return (
    <section className={cn(APP_CONTENT_HEIGHT_CLASS, "flex flex-col")}>
      <KioskPanelClient
        colaboratorId={colaboratorId}
        colaboratorName={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl ?? null}
        facePhotoUrl={facePhotoUrl}
        initialLiberadas={liberadas ?? EMPTY_LIBERADAS}
        maxSimultaneousSubtaskIntervalSeconds={
          kioskSettings.maxSimultaneousSubtaskIntervalSeconds
        }
        staffUserId={staffUserId}
        allowFaceEdit
        backHref={appQueuesPath()}
        toolbarTopRadiusClass={toolbarTopRadiusClass}
      />
    </section>
  );
}
