import { describe, expect, it } from "vitest";

import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
} from "./create-user-payload";

describe("buildCreateUserPayload", () => {
  it("sends roleType only (no role id, no /roles API)", () => {
    const payload = buildCreateUserPayload({
      name: "Maria",
      username: "maria.1",
      password: "123456",
      code: 1,
      roleType: "colaborator",
    });
    expect(payload).toEqual({
      username: "maria.1",
      email: "maria.1@pixtrela.local",
      password: "123456",
      name: "Maria",
      code: 1,
      roleType: "colaborator",
      confirmed: true,
    });
    expect(payload).not.toHaveProperty("role");
  });
});

describe("buildUpdateUserPayload", () => {
  it("includes roleType without role id", () => {
    expect(buildUpdateUserPayload({ roleType: "leader" })).toEqual({
      roleType: "leader",
    });
  });
});
