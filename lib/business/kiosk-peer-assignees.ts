export type KioskPeerAssignee = {
  colaboratorId: string;
  name: string;
  isActive: boolean;
};

export function buildKioskPeerAssignees(
  assignedToIds: readonly string[],
  activeColaboratorIds: readonly string[],
  viewerColaboratorId: string,
  nameById: ReadonlyMap<string, string>,
): KioskPeerAssignee[] {
  const activeSet = new Set(activeColaboratorIds);
  return assignedToIds
    .filter((id) => id !== viewerColaboratorId)
    .map((id) => ({
      colaboratorId: id,
      name: nameById.get(id)?.trim() ?? "",
      isActive: activeSet.has(id),
    }))
    .filter((row) => row.name.length > 0);
}
