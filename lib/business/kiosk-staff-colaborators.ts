export type KioskStaffActorRole = "admin" | "manager" | "leader";

export function canStaffSetColaboratorPassword(
  actorRole: KioskStaffActorRole,
  targetIsColaborator: boolean,
  leaderTeamColaboratorDocumentIds: Set<string>,
  targetDocumentId: string,
): boolean {
  if (!targetIsColaborator) return false;
  if (actorRole === "admin" || actorRole === "manager") return true;
  return leaderTeamColaboratorDocumentIds.has(targetDocumentId);
}
