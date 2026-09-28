/** Own queue edits face only. Another colaborator queue also resets password. */
export function showQueueCredentialPasswordForm(
  staffUserId: string | undefined,
  colaboratorId: string,
  targetRole?: string,
): boolean {
  if (targetRole && targetRole !== "colaborator") return false;
  if (!staffUserId) return true;
  return staffUserId !== colaboratorId;
}
