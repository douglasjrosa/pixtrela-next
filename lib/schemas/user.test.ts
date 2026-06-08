import { describe, expect, it } from "vitest";

import { userFormSchema } from "./user";

describe("userFormSchema", () => {
  it("accepts valid user", () => {
    expect(
      userFormSchema.parse({
        name: "Maria",
        username: "maria.9876",
        password: "123456",
        code: 9876,
        roleType: "colaborator",
      }),
    ).toMatchObject({ username: "maria.9876" });
  });

  it("allows empty password for edit flows", () => {
    expect(
      userFormSchema.parse({
        name: "Maria",
        username: "maria.9876",
        password: "",
        code: 9876,
        roleType: "colaborator",
      }),
    ).toMatchObject({ name: "Maria" });
  });
});
