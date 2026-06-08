/** Strapi filter: users belonging to a team led by leaderId. */
export function leaderTeamUserFilter(leaderId: string): Record<string, unknown> {
  return {
    teams: {
      leader: { id: { $eq: leaderId } },
    },
  };
}

/** Strapi filter: colaborators of teams where user is leader. */
export function leaderColaboratorFilter(leaderId: string): Record<string, unknown> {
  return {
    role: { type: { $eq: "colaborator" } },
    teams: {
      leader: { id: { $eq: leaderId } },
    },
  };
}

/** Whether viewer may see target user (leader sees own team colaborators). */
export function canViewUser(
  viewerRole: string,
  viewerId: string,
  target: { id: string; roleType?: string; teamLeaderIds?: string[] },
): boolean {
  if (viewerRole === "admin" || viewerRole === "manager") return true;
  if (viewerRole === "leader") {
    return (
      target.roleType === "colaborator" &&
      (target.teamLeaderIds?.includes(viewerId) ?? false)
    );
  }
  return viewerId === target.id;
}
