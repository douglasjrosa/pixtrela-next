import { loadKioskProducingSnapshot } from "@/lib/kiosk/load-assigned-subtasks";
import { emptyKioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

import { KioskQueueProducingSeed } from "./kiosk-queue-seeds";

export async function KioskQueueProducingBlock({
  colaboratorId,
  liveChainIntervalSeconds,
  queuePageSize,
}: {
  colaboratorId: string;
  liveChainIntervalSeconds: number;
  queuePageSize: number;
}) {
  const page =
    (await loadKioskProducingSnapshot({
      colaboratorId,
      liveChainIntervalSeconds,
      queuePageSize,
    })) ?? emptyKioskQueueSectionPage(queuePageSize);
  return <KioskQueueProducingSeed page={page} />;
}
