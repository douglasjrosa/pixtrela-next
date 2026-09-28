export type QueueOpenActorRole = "admin" | "manager" | "leader";

export type QueueOpenTarget = {
  id: string;
  role: string;
  active: boolean;
  blocked: boolean;
};

/**
 * Who may open a production queue. Do not use for password/face of others —
 * that stays on `canStaffSetColaboratorPassword`.
 *
 * Manager+ open any active colaborator. A leader opens colaborators on their
 * teams. Any staff actor may open their own queue.
 */
export function canStaffOpenQueue(input: {
  actorRole: QueueOpenActorRole;
  actorId: string;
  target: QueueOpenTarget;
  leaderTeamColaboratorIds: Set<string>;
}): boolean {
  const { actorRole, actorId, target, leaderTeamColaboratorIds } = input;
  if (!target.active || target.blocked) return false;
  if (target.id === actorId) return true;

  if (actorRole === "admin" || actorRole === "manager") {
    return target.role === "colaborator" || target.role === "leader";
  }

  if (target.role !== "colaborator") return false;
  return leaderTeamColaboratorIds.has(target.id);
}

export function isQueueProfileRole(role: string): boolean {
  return (
    role === "colaborator" ||
    role === "leader" ||
    role === "manager" ||
    role === "admin"
  );
}
