import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  listKioskQueueData,
  listKioskQueueSectionPage,
  type KioskQueueData,
  type KioskQueueSectionPage,
} from "@/lib/repos/kiosk-subtasks";
import type { KioskQueueSectionKey } from "@/lib/business/kiosk-queue-units";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";

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
  liveChainIntervalSeconds?: number;
  queuePageSize?: number;
}): Promise<KioskQueueSectionPage | null> {
  try {
    let liveChainIntervalSeconds = input.liveChainIntervalSeconds;
    let queuePageSize = input.queuePageSize;
    if (liveChainIntervalSeconds == null || queuePageSize == null) {
      const settings = await loadKioskSettings();
      liveChainIntervalSeconds ??= settings.maxSimultaneousSubtaskIntervalSeconds;
      queuePageSize ??= settings.queuePageSize;
    }
    return await listKioskQueueSectionPage({
      ...input,
      liveChainIntervalSeconds,
      queuePageSize,
    });
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
