import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  listKioskQueueData,
  type KioskQueueData,
} from "@/lib/repos/kiosk-subtasks";

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
