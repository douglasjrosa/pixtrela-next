import { describe, expect, it } from "vitest";

import {
  buildMeQueryString,
  resolveRoleFromLoginUser,
  resolveRoleFromMe,
  resolveSessionRole,
} from "./strapi-me";

describe("buildMeQueryString", () => {
  it("uses nested populate for role.type", () => {
    expect(buildMeQueryString()).toContain("populate[role][fields][0]=type");
  });
});

describe("resolveRoleFromLoginUser", () => {
  it("reads roleType from auth/local user (sys-rbx pattern)", () => {
    expect(resolveRoleFromLoginUser({ roleType: "manager" })).toBe("manager");
  });

  it("returns null when roleType is missing", () => {
    expect(resolveRoleFromLoginUser({ username: "x" })).toBeNull();
  });
});

describe("resolveRoleFromMe", () => {
  it("reads manager from a flat me payload", () => {
    expect(resolveRoleFromMe({ role: { type: "manager" } })).toBe("manager");
  });

  it("reads admin from a Strapi data wrapper", () => {
    expect(resolveRoleFromMe({ data: { role: { type: "admin" } } })).toBe("admin");
  });
});

describe("resolveSessionRole", () => {
  it("prefers login roleType over /users/me", () => {
    expect(
      resolveSessionRole(
        { roleType: "manager" },
        { role: { type: "colaborator" } },
      ),
    ).toBe("manager");
  });

  it("defaults to colaborator", () => {
    expect(resolveSessionRole({}, null)).toBe("colaborator");
  });
});
