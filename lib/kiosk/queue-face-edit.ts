import { isQueueProfileRole } from "@/lib/business/queue-open-access";

/** Totem staff queue: who may open the facial photo form. */
export function showQueueFaceEditForm(
  staffUserId: string | undefined,
  queueUserId: string,
  targetRole: string | undefined,
  allowFaceEdit: boolean,
): boolean {
  if (!allowFaceEdit || !staffUserId) return false;
  if (staffUserId === queueUserId) return true;
  if (!targetRole) return false;
  return isQueueProfileRole(targetRole);
}
