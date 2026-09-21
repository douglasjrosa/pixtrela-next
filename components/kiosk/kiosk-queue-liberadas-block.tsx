import { loadKioskQueueSectionPage } from "@/lib/kiosk/load-assigned-subtasks";
import { emptyKioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

import { KioskQueueLiberadasSeed } from "./kiosk-queue-seeds";

export async function KioskQueueLiberadasBlock({
  colaboratorId,
  liveChainIntervalSeconds,
  queuePageSize,
}: {
  colaboratorId: string;
  liveChainIntervalSeconds: number;
  queuePageSize: number;
}) {
  const page =
    (await loadKioskQueueSectionPage({
      colaboratorId,
      section: "liberadas",
      liveChainIntervalSeconds,
      queuePageSize,
      catalogMode: "slim",
    })) ?? emptyKioskQueueSectionPage(queuePageSize);
  return <KioskQueueLiberadasSeed page={page} />;
}
