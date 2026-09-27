export type TeamLeaderAssigneeMember = {
  documentId: string;
  name: string;
};

/**
 * Board/queue picker members: colaborators first, team leader last.
 * The leader is a DTO-only badge (`isLeader`) and is not stored on
 * `team_members`. If they already appear in the list, they are moved last.
 */
export function appendTeamLeaderAsLastMember<
  T extends { documentId: string },
>(
  members: T[],
  leader: T | null,
): Array<T & { isLeader?: boolean }> {
  const withoutLeader = leader
    ? members.filter((member) => member.documentId !== leader.documentId)
    : members;

  if (!leader) {
    return withoutLeader.map((member) => ({ ...member }));
  }

  return [
    ...withoutLeader.map((member) => ({ ...member })),
    { ...leader, isLeader: true },
  ];
}

/** Assignees are user ids. Role is not a gate — leaders may produce. */
export function canAssignUserIdToSubTask(userId: string): boolean {
  return userId.trim().length > 0;
}
