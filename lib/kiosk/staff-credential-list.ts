export type StaffCredentialListRow = {
  documentId: string;
  name: string;
  code: number | null;
  facePhotoUrl?: string | null;
};

/** Dedupes then appends the staff row so they can register their own face. */
export function mergeStaffSelfIntoCredentialList<
  T extends { documentId: string },
>(colaborators: T[], staff: T | null): T[] {
  if (!staff) return colaborators;
  const withoutSelf = colaborators.filter(
    (row) => row.documentId !== staff.documentId,
  );
  return [...withoutSelf, staff];
}
