import { describe, it, expect } from "vitest";
import { colaboratorMenuItems, homeHrefForRole, navItemsForRole } from "./nav";

function hrefs(role: Parameters<typeof navItemsForRole>[0]) {
  return navItemsForRole(role).map((item) => item.href);
}

describe("navItemsForRole", () => {
  it("sends colaborator home links to private path when userId is set", () => {
    expect(navItemsForRole("colaborator", { userId: "col-1" }).map((i) => i.href))
      .toEqual(["/col-1", "/col-1/store", "/col-1/profile"]);
    expect(
      navItemsForRole("colaborator", { userId: "col-1" }).map((i) => i.labelKey),
    ).toEqual(["dashboard", "store", "profile"]);
  });

  it("exposes dashboard and store for the colaborator header menu", () => {
    expect(colaboratorMenuItems("col-1")).toEqual([
      { href: "/col-1", labelKey: "dashboard" },
      { href: "/col-1/store", labelKey: "store" },
    ]);
  });

  it("falls back to panel root when colaborator has no userId", () => {
    expect(hrefs("colaborator")).toEqual(["/"]);
  });

  it("includes profile when userId is provided for staff eligible roles", () => {
    expect(navItemsForRole("manager", { userId: "mgr-1" }).map((i) => i.href))
      .toContain("/mgr-1/profile");
    expect(navItemsForRole("admin", { userId: "admin-1" }).map((i) => i.href))
      .not.toContain("/admin-1/profile");
  });

  it("shows users and tasks to leader but not templates", () => {
    const result = hrefs("leader");
    expect(result).toContain("/");
    expect(result).toContain("/users");
    expect(result).toContain("/tasks");
    expect(result).not.toContain("/templates");
    expect(result).not.toContain("/templates/tasks");
    expect(result).not.toContain("/teams");
    expect(result).not.toContain("/exchange");
  });

  it("shows teams, awards, tasks and templates to manager", () => {
    const result = hrefs("manager");
    expect(result).toContain("/teams");
    expect(result).toContain("/awards");
    expect(result).toContain("/tasks");
    expect(result).toContain("/templates/tasks");
  });

  it("admin sees every management screen including settings steps", () => {
    const result = hrefs("admin");
    expect(result).toEqual(
      expect.arrayContaining([
        "/",
        "/board",
        "/tasks",
        "/templates/tasks",
        "/teams",
        "/awards",
        "/users",
        "/settings/files",
      ]),
    );
  });
});

describe("homeHrefForRole", () => {
  it("routes colaborator and kiosk to their homes", () => {
    expect(homeHrefForRole("colaborator", "col-1")).toBe("/col-1");
    expect(homeHrefForRole("kiosk")).toBe("/kiosk");
    expect(homeHrefForRole("manager")).toBe("/");
  });
});
