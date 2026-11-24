import type { Role } from "@/lib/auth/nav";
import {
  canLeaderArchiveWorkday,
  canLeaderEditWorkday,
  type WorkdayWriteContext,
} from "@/lib/domain/workday-write-policy";
import type { WorkdayWithRelations } from "@/lib/repos/workdays";
import { toWorkdayPolicySnapshot } from "@/lib/repos/workdays";

export function workdayRowPermissions(
  row: WorkdayWithRelations,
  context: WorkdayWriteContext | null,
  role: Role | undefined,
): { editable: boolean; archivable: boolean } {
  if (role === "admin" || role === "manager") {
    return { editable: true, archivable: true };
  }
  if (role !== "leader" || !context) {
    return { editable: false, archivable: false };
  }
  const snapshot = toWorkdayPolicySnapshot(row);
  return {
    editable: canLeaderEditWorkday(snapshot, context),
    archivable: canLeaderArchiveWorkday(snapshot, context),
  };
}
