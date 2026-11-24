import { describe, expect, it } from "vitest";

import {
  assertWorkdayWritePolicy,
  canLeaderArchiveWorkday,
  canLeaderEditWorkday,
  type WorkdayPolicySnapshot,
} from "./workday-write-policy";

const USER_ID = "22222222-2222-4222-8222-222222222222";

function snapshot(
  overrides: Partial<WorkdayPolicySnapshot> = {},
): WorkdayPolicySnapshot {
  return {
    action: "absence",
    scope: "user",
    timezone: "America/Sao_Paulo",
    validFrom: null,
    validUntil: null,
    description: "Falta registrada pelo lider da equipe.",
    userIds: [USER_ID],
    teamIds: [],
    slots: [
      {
        isRecurrent: false,
        date: "2026-11-24",
        startMinute: 0,
        endMinute: 1440,
      },
    ],
    ...overrides,
  };
}

const leaderCtx = {
  role: "leader" as const,
  todayIso: "2026-11-24",
  allowedUserIds: [USER_ID],
};

describe("assertWorkdayWritePolicy", () => {
  it("allows manager writes without extra checks", () => {
    expect(() =>
      assertWorkdayWritePolicy(snapshot({ action: "work" }), {
        role: "manager",
        todayIso: "2026-11-24",
        allowedUserIds: null,
      }, null),
    ).not.toThrow();
  });

  it("blocks leaders from factory types and past dates", () => {
    expect(() =>
      assertWorkdayWritePolicy(
        snapshot({ action: "holiday", scope: "global", userIds: [] }),
        leaderCtx,
        null,
      ),
    ).toThrow("forbiddenAction");

    expect(() =>
      assertWorkdayWritePolicy(
        snapshot({
          slots: [
            {
              isRecurrent: false,
              date: "2026-11-23",
              startMinute: 0,
              endMinute: 1440,
            },
          ],
        }),
        leaderCtx,
        null,
      ),
    ).toThrow("slotDateInPast");
  });

  it("lets leaders flip a past absence to excused with a description", () => {
    const existing = snapshot({
      action: "absence",
      slots: [
        {
          isRecurrent: false,
          date: "2026-11-20",
          startMinute: 0,
          endMinute: 1440,
        },
      ],
    });
    expect(() =>
      assertWorkdayWritePolicy(
        snapshot({
          action: "excused_absence",
          description: "Atestado medico entregue na portaria.",
          slots: existing.slots,
        }),
        leaderCtx,
        existing,
      ),
    ).not.toThrow();
  });

  it("rejects past edits that change slots or skip the description", () => {
    const existing = snapshot({
      action: "absence",
      slots: [
        {
          isRecurrent: false,
          date: "2026-11-20",
          startMinute: 0,
          endMinute: 1440,
        },
      ],
    });
    expect(() =>
      assertWorkdayWritePolicy(
        snapshot({
          action: "excused_absence",
          description: "curto",
          slots: existing.slots,
        }),
        leaderCtx,
        existing,
      ),
    ).toThrow("descriptionRequired");
  });
});

describe("leader row permissions", () => {
  it("archives only future team-member avulsos", () => {
    expect(
      canLeaderArchiveWorkday(snapshot(), leaderCtx),
    ).toBe(true);
    expect(
      canLeaderArchiveWorkday(
        snapshot({
          slots: [
            {
              isRecurrent: false,
              date: "2026-11-20",
              startMinute: 0,
              endMinute: 1440,
            },
          ],
        }),
        leaderCtx,
      ),
    ).toBe(false);
    expect(
      canLeaderArchiveWorkday(snapshot({ action: "work" }), leaderCtx),
    ).toBe(false);
  });

  it("allows editing past absences for the excused flip", () => {
    expect(
      canLeaderEditWorkday(
        snapshot({
          action: "absence",
          slots: [
            {
              isRecurrent: false,
              date: "2026-11-20",
              startMinute: 0,
              endMinute: 1440,
            },
          ],
        }),
        leaderCtx,
      ),
    ).toBe(true);
    expect(
      canLeaderEditWorkday(
        snapshot({
          action: "overtime",
          slots: [
            {
              isRecurrent: false,
              date: "2026-11-20",
              startMinute: 480,
              endMinute: 720,
            },
          ],
        }),
        leaderCtx,
      ),
    ).toBe(false);
  });
});
