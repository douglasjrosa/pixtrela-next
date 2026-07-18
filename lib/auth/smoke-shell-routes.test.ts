import { describe, expect, it } from "vitest";

import { smokeShellHrefsForRole } from "./smoke-shell-routes";

describe("smokeShellHrefsForRole", () => {
  it("includes board for manager nav shell", () => {
    const hrefs = smokeShellHrefsForRole("manager");
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/board");
    expect(hrefs).toContain("/tasks");
    expect(hrefs).not.toContain("/settings/steps");
  });

  it("returns only panel for colaborator nav", () => {
    expect(smokeShellHrefsForRole("colaborator")).toEqual(["/"]);
  });

  it("returns kiosk home for kiosk role", () => {
    expect(smokeShellHrefsForRole("kiosk")).toEqual(["/kiosk"]);
  });
});
