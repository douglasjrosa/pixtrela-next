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
