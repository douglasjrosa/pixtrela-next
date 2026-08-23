/** Matches UI inactive state used for bulk hard-delete eligibility. */
export function isUserArchivedForHardDelete(user: {
  active: boolean;
  blocked: boolean;
}): boolean {
  return !user.active || user.blocked;
}
