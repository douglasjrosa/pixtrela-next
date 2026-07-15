import { describe, it, expect } from "vitest";
import { navItemsForRole } from "./nav";

function hrefs(role: Parameters<typeof navItemsForRole>[0]) {
  return navItemsForRole(role).map((item) => item.href);
}

describe("navItemsForRole", () => {
  it("shows panel link to colaborator", () => {
    expect(hrefs("colaborator")).toEqual(["/"]);
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
        "/settings/steps",
      ]),
    );
  });
});
