import { describe, expect, it } from "vitest";

import { isAppNavLinkActive } from "./is-app-nav-link-active";

describe("isAppNavLinkActive", () => {
  it("matches panel only on the root path", () => {
    expect(isAppNavLinkActive("/", "/")).toBe(true);
    expect(isAppNavLinkActive("/tasks", "/")).toBe(false);
  });

  it("matches nested routes under a section href", () => {
    expect(isAppNavLinkActive("/tasks/abc", "/tasks")).toBe(true);
    expect(isAppNavLinkActive("/board", "/tasks")).toBe(false);
  });

  it("matches document dashboard only on the exact path when configured", () => {
    const dashboardHref = "/col-1";
    const exact = { exactMatchHrefs: [dashboardHref] as const };

    expect(isAppNavLinkActive("/col-1", dashboardHref, exact)).toBe(true);
    expect(isAppNavLinkActive("/col-1/store", dashboardHref, exact)).toBe(false);
  });

  it("matches any settings route when href is under settings", () => {
    expect(isAppNavLinkActive("/settings/currency", "/settings/logs")).toBe(
      true,
    );
    expect(isAppNavLinkActive("/settings/logs", "/settings/logs")).toBe(true);
  });
});
