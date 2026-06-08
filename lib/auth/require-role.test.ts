import { describe, expect, it } from "vitest";

import { requirePermission, requireRole } from "./require-role";
import { canManageTasks } from "./permissions";

describe("requireRole", () => {
  it("allows when role is in the list", () => {
    const result = requireRole(
      { user: { role: "manager" }, expires: "" },
      ["admin", "manager"],
    );
    expect(result.allowed).toBe(true);
    expect(result.role).toBe("manager");
  });

  it("denies when role is missing", () => {
    const result = requireRole(null, ["admin"]);
    expect(result.allowed).toBe(false);
  });
});

describe("requirePermission", () => {
  it("uses permission predicate", () => {
    const result = requirePermission(
      { user: { role: "leader" }, expires: "" },
      canManageTasks,
    );
    expect(result.allowed).toBe(true);
  });
});
