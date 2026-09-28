/** Totem staff queue: who may open the facial photo form. */
export function showQueueFaceEditForm(
  staffUserId: string | undefined,
  queueUserId: string,
  targetRole: string | undefined,
  allowFaceEdit: boolean,
): boolean {
  if (!allowFaceEdit || !staffUserId) return false;
  if (staffUserId === queueUserId) return true;
  return targetRole === "colaborator";
}
