import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  listKioskQueueData,
  listKioskQueueSectionPage,
  type KioskQueueData,
  type KioskQueueSectionPage,
} from "@/lib/repos/kiosk-subtasks";
import type { KioskQueueSectionKey } from "@/lib/business/kiosk-queue-units";
import { loadKioskLiveChainIntervalSeconds } from "@/lib/kiosk/load-session-idle";

export async function loadKioskQueueForColaborator(
  colaboratorId: string,
): Promise<KioskQueueData> {
  try {
    return await listKioskQueueData(colaboratorId);
  } catch (error) {
    rethrowIfNavigationError(error);
    return { subTasks: [], catalog: [], openRuns: [] };
  }
}

export async function loadKioskQueueSectionPage(input: {
  colaboratorId: string;
  section: KioskQueueSectionKey;
  cursor?: string | null;
}): Promise<KioskQueueSectionPage | null> {
  try {
    const liveChainIntervalSeconds = await loadKioskLiveChainIntervalSeconds();
    return await listKioskQueueSectionPage({
      ...input,
      liveChainIntervalSeconds,
    });
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
