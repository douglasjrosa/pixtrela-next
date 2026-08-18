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

  it("returns panel root for colaborator without userId", () => {
    expect(smokeShellHrefsForRole("colaborator")).toEqual(["/"]);
  });

  it("returns private home routes for colaborator with userId", () => {
    expect(smokeShellHrefsForRole("colaborator", "col-1")).toEqual([
      "/col-1",
      "/col-1/store",
      "/col-1/profile",
    ]);
  });

  it("returns kiosk home for kiosk role", () => {
    expect(smokeShellHrefsForRole("kiosk")).toEqual(["/kiosk"]);
  });
});
