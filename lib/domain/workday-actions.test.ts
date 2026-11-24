import { describe, expect, it } from "vitest";

import {
  allowedWorkdayScopes,
  defaultWorkdayActionForRole,
  defaultWorkdayScope,
  isCivilDayWorkdayAction,
  isLeaderWorkdayAction,
  isRecurrentWorkdayAction,
  leaderPastFlipTarget,
  requiresWorkdayDescription,
  workdayActionClass,
  workdayActionClassRank,
  workdayPolarity,
} from "./workday-actions";

describe("workdayActionClass", () => {
  it("groups absence family, extra, civil off, and work", () => {
    expect(workdayActionClass("absence")).toBe("absence_family");
    expect(workdayActionClass("excused_absence")).toBe("absence_family");
    expect(workdayActionClass("partial_absence")).toBe("absence_family");
    expect(workdayActionClass("partial_excused_absence")).toBe(
      "absence_family",
    );
    expect(workdayActionClass("overtime")).toBe("extra");
    expect(workdayActionClass("make_up")).toBe("extra");
    expect(workdayActionClass("holiday")).toBe("civil_off");
    expect(workdayActionClass("off")).toBe("civil_off");
    expect(workdayActionClass("work")).toBe("work");
  });
});

describe("workdayPolarity", () => {
  it("maps classes to work or off coverage", () => {
    expect(workdayPolarity("absence")).toBe("off");
    expect(workdayPolarity("holiday")).toBe("off");
    expect(workdayPolarity("off")).toBe("off");
    expect(workdayPolarity("work")).toBe("work");
    expect(workdayPolarity("overtime")).toBe("work");
    expect(workdayPolarity("make_up")).toBe("work");
  });
});

describe("workdayActionClassRank", () => {
  it("ranks absence above extra above holiday/off above work", () => {
    expect(workdayActionClassRank("absence")).toBeGreaterThan(
      workdayActionClassRank("overtime"),
    );
    expect(workdayActionClassRank("overtime")).toBeGreaterThan(
      workdayActionClassRank("holiday"),
    );
    expect(workdayActionClassRank("holiday")).toBeGreaterThan(
      workdayActionClassRank("work"),
    );
    expect(workdayActionClassRank("holiday")).toBe(
      workdayActionClassRank("off"),
    );
  });
});

describe("slot shape helpers", () => {
  it("treats holiday and full-day absences as civil-day", () => {
    expect(isCivilDayWorkdayAction("holiday")).toBe(true);
    expect(isCivilDayWorkdayAction("absence")).toBe(true);
    expect(isCivilDayWorkdayAction("off")).toBe(false);
    expect(isCivilDayWorkdayAction("work")).toBe(false);
  });

  it("allows recurrent slots only for factory work scale", () => {
    expect(isRecurrentWorkdayAction("work")).toBe(true);
    expect(isRecurrentWorkdayAction("holiday")).toBe(false);
    expect(isRecurrentWorkdayAction("overtime")).toBe(false);
  });
});

describe("role and form defaults", () => {
  it("defaults leader to absence and manager to work", () => {
    expect(defaultWorkdayActionForRole("leader")).toBe("absence");
    expect(defaultWorkdayActionForRole("manager")).toBe("work");
    expect(defaultWorkdayActionForRole("admin")).toBe("work");
  });

  it("restricts holiday to global and avulsos to user", () => {
    expect(allowedWorkdayScopes("holiday")).toEqual(["global"]);
    expect(allowedWorkdayScopes("work")).toEqual(["global", "team", "user"]);
    expect(allowedWorkdayScopes("off")).toEqual(["global", "team", "user"]);
    expect(allowedWorkdayScopes("absence")).toEqual(["user"]);
    expect(defaultWorkdayScope("work")).toBe("global");
    expect(defaultWorkdayScope("off")).toBe("user");
  });

  it("lets leaders create absence family, overtime, and make-up only", () => {
    expect(isLeaderWorkdayAction("absence")).toBe(true);
    expect(isLeaderWorkdayAction("overtime")).toBe(true);
    expect(isLeaderWorkdayAction("work")).toBe(false);
    expect(isLeaderWorkdayAction("holiday")).toBe(false);
    expect(isLeaderWorkdayAction("off")).toBe(false);
  });

  it("requires a description for excused types and make-up", () => {
    expect(requiresWorkdayDescription("excused_absence")).toBe(true);
    expect(requiresWorkdayDescription("make_up")).toBe(true);
    expect(requiresWorkdayDescription("absence")).toBe(false);
  });

  it("flips past absences only to the excused counterpart", () => {
    expect(leaderPastFlipTarget("absence")).toBe("excused_absence");
    expect(leaderPastFlipTarget("partial_absence")).toBe(
      "partial_excused_absence",
    );
    expect(leaderPastFlipTarget("overtime")).toBeNull();
  });
});
