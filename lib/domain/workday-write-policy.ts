import type { Role } from "@/lib/auth/nav";
import {
  DEFAULT_WORKDAY_TIMEZONE,
  WORKDAY_DESCRIPTION_MIN_REQUIRED,
} from "@/lib/schemas/workday-constants";

import {
  isLeaderWorkdayAction,
  leaderPastFlipTarget,
  type WorkdayAction,
} from "./workday-actions";

export type WorkdayPolicySlot = {
  isRecurrent: boolean;
  date: string | null;
  startMinute: number;
  endMinute: number;
};

export type WorkdayPolicySnapshot = {
  action: WorkdayAction;
  scope: "global" | "team" | "user";
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  description: string | null;
  userIds: readonly string[];
  teamIds: readonly string[];
  slots: readonly WorkdayPolicySlot[];
};

export type WorkdayWriteContext = {
  role: Role;
  todayIso: string;
  allowedUserIds: readonly string[] | null;
};

function datedSlotDate(slots: readonly WorkdayPolicySlot[]): string | null {
  const dated = slots.find((slot) => !slot.isRecurrent && slot.date);
  return dated?.date ?? null;
}

function sameIds(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}

function sameSlots(
  left: readonly WorkdayPolicySlot[],
  right: readonly WorkdayPolicySlot[],
): boolean {
  if (left.length !== right.length) return false;
  return left.every((slot, index) => {
    const other = right[index];
    return (
      other !== undefined &&
      slot.isRecurrent === other.isRecurrent &&
      slot.date === other.date &&
      slot.startMinute === other.startMinute &&
      slot.endMinute === other.endMinute
    );
  });
}

function assertLeaderUserScope(
  input: WorkdayPolicySnapshot,
  allowedUserIds: readonly string[] | null,
): void {
  if (input.scope !== "user") {
    throw new Error("forbiddenScope");
  }
  if (allowedUserIds) {
    for (const userId of input.userIds) {
      if (!allowedUserIds.includes(userId)) {
        throw new Error("forbiddenUser");
      }
    }
  }
}

function assertLeaderPastFlip(
  existing: WorkdayPolicySnapshot,
  input: WorkdayPolicySnapshot,
): void {
  const target = leaderPastFlipTarget(existing.action);
  if (!target || input.action !== target) {
    throw new Error("forbiddenPastEdit");
  }
  if (input.scope !== existing.scope) throw new Error("forbiddenPastEdit");
  if (input.timezone !== existing.timezone) throw new Error("forbiddenPastEdit");
  if (input.validFrom !== existing.validFrom) {
    throw new Error("forbiddenPastEdit");
  }
  if (input.validUntil !== existing.validUntil) {
    throw new Error("forbiddenPastEdit");
  }
  if (!sameIds(input.userIds, existing.userIds)) {
    throw new Error("forbiddenPastEdit");
  }
  if (!sameSlots(input.slots, existing.slots)) {
    throw new Error("forbiddenPastEdit");
  }
  const description = input.description?.trim() ?? "";
  if (description.length < WORKDAY_DESCRIPTION_MIN_REQUIRED) {
    throw new Error("descriptionRequired");
  }
}

export function assertWorkdayWritePolicy(
  input: WorkdayPolicySnapshot,
  context: WorkdayWriteContext,
  existing: WorkdayPolicySnapshot | null,
): void {
  if (context.role !== "leader") return;

  if (!isLeaderWorkdayAction(input.action)) {
    throw new Error("forbiddenAction");
  }
  if (input.timezone !== DEFAULT_WORKDAY_TIMEZONE) {
    throw new Error("forbiddenTimezone");
  }
  if (input.validFrom || input.validUntil) {
    throw new Error("forbiddenValidity");
  }
  assertLeaderUserScope(input, context.allowedUserIds);

  const existingDate = existing ? datedSlotDate(existing.slots) : null;
  if (existing && existingDate && existingDate < context.todayIso) {
    assertLeaderPastFlip(existing, input);
    return;
  }

  const slotDate = datedSlotDate(input.slots);
  if (!slotDate || slotDate < context.todayIso) {
    throw new Error("slotDateInPast");
  }
}

export function canLeaderArchiveWorkday(
  existing: WorkdayPolicySnapshot,
  context: WorkdayWriteContext,
): boolean {
  if (context.role !== "leader") return false;
  if (!isLeaderWorkdayAction(existing.action)) return false;
  if (existing.scope !== "user") return false;
  if (context.allowedUserIds) {
    const allAllowed = existing.userIds.every((userId) =>
      context.allowedUserIds?.includes(userId),
    );
    if (!allAllowed) return false;
  }
  const slotDate = datedSlotDate(existing.slots);
  return Boolean(slotDate && slotDate >= context.todayIso);
}

export function canLeaderEditWorkday(
  existing: WorkdayPolicySnapshot,
  context: WorkdayWriteContext,
): boolean {
  if (context.role !== "leader") return false;
  if (!isLeaderWorkdayAction(existing.action)) return false;
  if (existing.scope !== "user") return false;
  if (context.allowedUserIds) {
    const allAllowed = existing.userIds.every((userId) =>
      context.allowedUserIds?.includes(userId),
    );
    if (!allAllowed) return false;
  }
  const slotDate = datedSlotDate(existing.slots);
  if (!slotDate) return false;
  if (slotDate >= context.todayIso) return true;
  return leaderPastFlipTarget(existing.action) !== null;
}
