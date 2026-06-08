import { describe, it, expect } from "vitest";
import { navItemsForRole } from "./nav";

function hrefs(role: Parameters<typeof navItemsForRole>[0]) {
  return navItemsForRole(role).map((item) => item.href);
}

describe("navItemsForRole", () => {
  it("shows no staff nav items to colaborator", () => {
    expect(hrefs("colaborator")).toEqual([]);
  });

  it("shows templates, users and tasks to leader", () => {
    const result = hrefs("leader");
    expect(result).toContain("/templates");
    expect(result).toContain("/users");
    expect(result).toContain("/tasks");
    expect(result).not.toContain("/teams");
    expect(result).not.toContain("/exchange");
  });

  it("shows teams, awards and tasks to manager", () => {
    const result = hrefs("manager");
    expect(result).toContain("/teams");
    expect(result).toContain("/awards");
    expect(result).toContain("/tasks");
  });

  it("admin sees every management screen including settings", () => {
    const result = hrefs("admin");
    expect(result).toEqual(
      expect.arrayContaining([
        "/board",
        "/tasks",
        "/templates",
        "/teams",
        "/awards",
        "/users",
        "/settings",
      ]),
    );
  });
});
