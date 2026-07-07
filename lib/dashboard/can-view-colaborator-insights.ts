import type { Role } from "@/lib/auth/nav";

export function canViewColaboratorInsights(
  viewerRole: Role | undefined,
  viewerId: string | undefined,
  targetDocumentId: string,
  leaderTeamMemberIds?: string[],
): boolean {
  if (!viewerRole || !viewerId) return false;

  if (viewerRole === "admin" || viewerRole === "manager") return true;

  if (viewerRole === "colaborator") {
    return viewerId === targetDocumentId;
  }

  if (viewerRole === "leader") {
    return leaderTeamMemberIds?.includes(targetDocumentId) ?? false;
  }

  return false;
}
