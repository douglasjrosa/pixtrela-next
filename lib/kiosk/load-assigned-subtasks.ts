import { cache } from "react";

import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  listKioskQueueData,
  listKioskQueueSectionPage,
  listKioskProducingSnapshot,
  type KioskQueueCatalogMode,
  type KioskQueueData,
  type KioskQueueSectionPage,
} from "@/lib/repos/kiosk-subtasks";
import type { KioskQueueSectionKey } from "@/lib/business/kiosk-queue-units";
import { loadKioskSettings } from "@/lib/kiosk/load-session-idle";

/** Per-request queue build without catalog-wide flag I/O. */
export const loadKioskQueueBuild = cache(
  async (colaboratorId: string): Promise<KioskQueueData> =>
    listKioskQueueData(colaboratorId, undefined, { attachCatalogFlags: false }),
);

export async function loadKioskQueueForColaborator(
  colaboratorId: string,
): Promise<KioskQueueData> {
  try {
    return await loadKioskQueueBuild(colaboratorId);
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
  catalogMode?: KioskQueueCatalogMode;
}): Promise<KioskQueueSectionPage | null> {
  try {
    let liveChainIntervalSeconds = input.liveChainIntervalSeconds;
    let queuePageSize = input.queuePageSize;
    if (liveChainIntervalSeconds == null || queuePageSize == null) {
      const settings = await loadKioskSettings();
      liveChainIntervalSeconds ??=
        settings.maxSimultaneousSubtaskIntervalSeconds;
      queuePageSize ??= settings.queuePageSize;
    }
    const catalogMode = input.catalogMode ?? "slim";
    const queue =
      catalogMode === "slim"
        ? await loadKioskQueueBuild(input.colaboratorId)
        : undefined;
    return await listKioskQueueSectionPage({
      ...input,
      liveChainIntervalSeconds,
      queuePageSize,
      catalogMode,
      queue,
    });
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}

export async function loadKioskProducingSnapshot(input: {
  colaboratorId: string;
  liveChainIntervalSeconds?: number;
  queuePageSize?: number;
}): Promise<KioskQueueSectionPage | null> {
  try {
    let liveChainIntervalSeconds = input.liveChainIntervalSeconds;
    let queuePageSize = input.queuePageSize;
    if (liveChainIntervalSeconds == null || queuePageSize == null) {
      const settings = await loadKioskSettings();
      liveChainIntervalSeconds ??=
        settings.maxSimultaneousSubtaskIntervalSeconds;
      queuePageSize ??= settings.queuePageSize;
    }
    return await listKioskProducingSnapshot(input.colaboratorId, undefined, {
      liveChainIntervalSeconds,
      queuePageSize,
    });
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
