import { auth } from "@/auth";
import { KioskContentSurface } from "@/components/kiosk/kiosk-content-surface";
import type { Role } from "@/lib/auth/nav";
import { loadKioskLiveChainIntervalSeconds } from "@/lib/kiosk/load-session-idle";
import { loadKioskQueueForColaborator } from "@/lib/kiosk/load-assigned-subtasks";
import { loadKioskColaboratorProfile } from "@/lib/kiosk/load-colaborator-profile";

import { KioskPanelClient } from "./kiosk-panel-client";

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";
  const [queue, profile, liveChainIntervalSeconds] = await Promise.all([
    loadKioskQueueForColaborator(colaboratorId),
    loadKioskColaboratorProfile(colaboratorId),
    loadKioskLiveChainIntervalSeconds(),
  ]);

  return (
    <KioskContentSurface>
      <KioskPanelClient
        colaboratorId={colaboratorId}
        colaboratorName={profile?.name ?? ""}
        avatarUrl={profile?.avatarUrl ?? null}
        subTasks={queue.subTasks}
        catalog={queue.catalog}
        openRuns={queue.openRuns}
        maxSimultaneousSubtaskIntervalSeconds={liveChainIntervalSeconds}
        readOnly={readOnly}
      />
    </KioskContentSurface>
  );
}
