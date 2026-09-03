import { auth } from "@/auth";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import type { Role } from "@/lib/auth/nav";
import { loadKioskQueueSectionPage } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";
import { loadKioskLiveChainIntervalSeconds } from "@/lib/kiosk/load-session-idle";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import { DEFAULT_KIOSK_QUEUE_PAGE_SIZE } from "@/lib/schemas/kiosk-setting";

import { KioskPanelClient } from "./kiosk-panel-client";

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

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";
  const [liberadas, profile, liveChainIntervalSeconds] = await Promise.all([
    loadKioskQueueSectionPage({
      colaboratorId,
      section: "liberadas",
    }),
    loadKioskColaboratorProfile(colaboratorId),
    loadKioskLiveChainIntervalSeconds(),
  ]);

  return (
    <KioskContentSurface>
      <KioskPanelClient
        colaboratorId={colaboratorId}
        colaboratorName={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl ?? null}
        initialLiberadas={liberadas ?? EMPTY_LIBERADAS}
        maxSimultaneousSubtaskIntervalSeconds={liveChainIntervalSeconds}
        readOnly={readOnly}
      />
    </KioskContentSurface>
  );
}
