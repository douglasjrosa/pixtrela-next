import { describe, expect, it } from "vitest";

import { manageableTargetRoles } from "@/lib/business/roles";
import type { Role } from "@/lib/auth/nav";
import {
  hasNoFunctionValues,
  isJsonSerializable,
} from "@/lib/server/serializable-props";

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

  it("flags render-prop children as non-serializable RSC payload", () => {
    const badPayload = {
      tasks: [],
      children: (_liveTasks: unknown) => null,
    };
    expect(hasNoFunctionValues(badPayload)).toBe(false);
  });
});
