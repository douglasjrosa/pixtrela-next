import type { Role } from "@/lib/auth/nav";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import type { WorkdayWriteContext } from "@/lib/domain/workday-write-policy";
import {
  listLeaderWorkdayScope,
  type WorkdayListViewer,
} from "@/lib/repos/workdays";
import { DEFAULT_WORKDAY_TIMEZONE } from "@/lib/schemas/workday";

export type WorkdayListViewerContext = {
  role: Role;
  viewer: WorkdayListViewer | null;
  writeContext: WorkdayWriteContext | null;
};

export async function resolveWorkdayViewerContext(input: {
  role: Role | undefined;
  userId: string | undefined;
}): Promise<WorkdayListViewerContext | null> {
  if (!input.role || !input.userId) return null;
  if (input.role !== "admin" && input.role !== "manager" && input.role !== "leader") {
    return null;
  }

  const todayIso = toCalendarDateKey(new Date(), DEFAULT_WORKDAY_TIMEZONE);
  if (input.role === "leader") {
    const scope = await listLeaderWorkdayScope(input.userId);
    const viewer: WorkdayListViewer = {
      role: "leader",
      userId: input.userId,
      teamIds: scope.teamIds,
      userIds: scope.userIds,
    };
    const writeContext: WorkdayWriteContext = {
      role: "leader",
      todayIso,
      allowedUserIds: scope.userIds,
    };
    return { role: input.role, viewer, writeContext };
  }

  return {
    role: input.role,
    viewer: {
      role: input.role,
      userId: input.userId,
      teamIds: [],
      userIds: [],
    },
    writeContext: {
      role: input.role,
      todayIso,
      allowedUserIds: null,
    },
  };
}
