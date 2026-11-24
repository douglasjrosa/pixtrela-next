import { listTeamMemberIds } from "@/lib/repos/teams";
import {
  recomputeDurationCreditsForUsersInRange,
} from "@/lib/repos/recompute-activity-credits";
import type { WorkdayWithRelations } from "@/lib/repos/workdays";
import type { Db } from "@/lib/db/client";

const MS_PER_DAY = 86_400_000;
const REPLAY_LOOKBACK_DAYS = 90;
const REPLAY_LOOKAHEAD_DAYS = 31;

export function workdayReplayRange(
  workday: Pick<WorkdayWithRelations, "validFrom" | "validUntil" | "slots">,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const dated = workday.slots
    .map((slot) => slot.date)
    .filter((date): date is string => Boolean(date))
    .sort();
  if (dated.length > 0) {
    const from = new Date(`${dated[0]}T00:00:00.000Z`);
    const to = new Date(`${dated[dated.length - 1]}T23:59:59.999Z`);
    return {
      from: new Date(from.getTime() - MS_PER_DAY),
      to: new Date(to.getTime() + MS_PER_DAY),
    };
  }

  const lookback = new Date(
    now.getTime() - REPLAY_LOOKBACK_DAYS * MS_PER_DAY,
  );
  const lookahead = new Date(
    now.getTime() + REPLAY_LOOKAHEAD_DAYS * MS_PER_DAY,
  );
  return {
    from: workday.validFrom
      ? new Date(`${workday.validFrom}T00:00:00.000Z`)
      : lookback,
    to: workday.validUntil
      ? new Date(`${workday.validUntil}T23:59:59.999Z`)
      : lookahead,
  };
}

export async function replayWorkdayDurationCredits(
  workday: WorkdayWithRelations,
  db: Db,
): Promise<void> {
  const range = workdayReplayRange(workday);
  let userIds: string[] | undefined;
  if (workday.scope === "user") {
    userIds = workday.users.map((user) => user.documentId);
  } else if (workday.scope === "team") {
    const nested = await Promise.all(
      workday.teams.map((team) => listTeamMemberIds(team.documentId, db)),
    );
    userIds = [...new Set(nested.flat())];
  }
  await recomputeDurationCreditsForUsersInRange(
    { userIds, from: range.from, to: range.to },
    db,
  );
}
