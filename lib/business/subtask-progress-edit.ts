import type { SubTaskFormInput } from "@/lib/schemas/sub-task";

export function applySubTaskProgressForRole(
  incoming: SubTaskFormInput,
  current: { status: SubTaskFormInput["status"]; timeSpent: number },
  canEdit: boolean,
): SubTaskFormInput {
  if (canEdit) {
    return {
      ...incoming,
      timeSpent: incoming.timeSpent ?? current.timeSpent,
    };
  }

  return {
    ...incoming,
    status: current.status,
    timeSpent: current.timeSpent,
  };
}
