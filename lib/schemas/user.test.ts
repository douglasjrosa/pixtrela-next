import { describe, expect, it } from "vitest";

import {
  USER_CODE_NOT_UNIQUE_KEY,
  USER_LOGIN_NOT_UNIQUE_KEY,
  buildUserFormSchema,
  createUserFormSchema,
  userFormSchema,
} from "./user";

const existingUsers = [
  { documentId: "u1", code: 1234, username: "maria.1234" },
  { documentId: "u2", code: 5678, username: "joao.5678" },
];

const validUser = {
  name: "Maria",
  username: "maria.9876",
  password: "123456",
  code: 9876,
  roleType: "colaborator" as const,
};

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

  it("requires password on admin create when requirePassword is true", () => {
    const schema = buildUserFormSchema({ requirePassword: true });
    expect(schema.safeParse({ ...validUser, password: "" }).success).toBe(false);
    expect(schema.safeParse({ ...validUser, password: "123456" }).success).toBe(true);
  });

  it("allows missing password when requirePassword is false", () => {
    const schema = buildUserFormSchema({ requirePassword: false });
    expect(schema.safeParse({ ...validUser, password: "" }).success).toBe(true);
    expect(
      schema.safeParse({
        name: validUser.name,
        username: validUser.username,
        code: validUser.code,
        roleType: validUser.roleType,
      }).success,
    ).toBe(true);
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

  it("rejects duplicate code on create", () => {
    const result = createUserFormSchema(existingUsers).safeParse({
      ...validUser,
      code: 1234,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(USER_CODE_NOT_UNIQUE_KEY);
  });

  it("allows the same code when editing that user", () => {
    expect(
      createUserFormSchema(existingUsers, "u1").parse({
        ...validUser,
        code: 1234,
      }),
    ).toMatchObject({ code: 1234 });
  });

  it("accepts a new unique code on create", () => {
    expect(createUserFormSchema(existingUsers).parse(validUser)).toMatchObject({
      code: 9876,
    });
  });

  it("rejects duplicate login on create", () => {
    const result = createUserFormSchema(existingUsers).safeParse({
      ...validUser,
      username: "Maria.1234",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(USER_LOGIN_NOT_UNIQUE_KEY);
  });

  it("rejects login whose derived email collides with an orphan email", () => {
    const withOrphan = [
      ...existingUsers,
      {
        documentId: "u3",
        code: 2,
        username: "joao.silva.2",
        email: "joao.2@pixtrela.local",
      },
    ];
    const result = createUserFormSchema(withOrphan).safeParse({
      ...validUser,
      username: "joao.2",
      code: 9999,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(USER_LOGIN_NOT_UNIQUE_KEY);
  });
});
