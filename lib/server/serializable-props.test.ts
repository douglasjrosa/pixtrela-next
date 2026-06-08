import { describe, expect, it } from "vitest";

import { manageableTargetRoles } from "@/lib/business/roles";
import type { Role } from "@/lib/auth/nav";

/** Props passed from RSC pages to client managers must be JSON-serializable. */
function isJsonSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function hasNoFunctionValues(value: Record<string, unknown>): boolean {
  return Object.values(value).every((entry) => typeof entry !== "function");
}

describe("RSC client props (non-action)", () => {
  it("manageableTargetRoles is serializable for every role", () => {
    const roles: Role[] = [
      "admin",
      "manager",
      "leader",
      "colaborator",
      "kiosk",
    ];
    for (const role of roles) {
      expect(isJsonSerializable(manageableTargetRoles(role))).toBe(true);
    }
  });

  it("users page static props exclude predicate functions", () => {
    const props = {
      canDelete: true,
      manageableRoles: manageableTargetRoles("manager"),
      users: [
        {
          id: 1,
          documentId: "u1",
          name: "Test",
          username: "test.1",
          code: 1,
          roleType: "colaborator" as const,
        },
      ],
    };
    expect(hasNoFunctionValues(props)).toBe(true);
    expect(isJsonSerializable(props)).toBe(true);
  });
});
