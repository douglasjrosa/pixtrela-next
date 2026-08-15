import type { KioskSubTask } from "@/lib/business/subtask-queue";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listAssignedSubTasks } from "@/lib/repos/kiosk-subtasks";

export async function loadAssignedSubTasksForColaborator(
  colaboratorId: string,
): Promise<KioskSubTask[]> {
  try {
    return await listAssignedSubTasks(colaboratorId);
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
