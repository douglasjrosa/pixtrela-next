import { describe, expect, it } from "vitest";

import {
  USER_CODE_NOT_UNIQUE_KEY,
  USER_EMAIL_NOT_UNIQUE_KEY,
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
  email: "maria@example.com",
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
        email: "maria@example.com",
        password: "123456",
        code: 9876,
        roleType: "colaborator",
      }),
    ).toMatchObject({ username: "maria.9876" });
  });

  it("requires password on admin create when requirePassword is true", () => {
    const schema = buildUserFormSchema({ requirePassword: true });
    const emptyPassword = schema.safeParse({ ...validUser, password: "" });
    expect(emptyPassword.success).toBe(false);
    if (emptyPassword.success) return;
    expect(emptyPassword.error.issues[0]?.message).toBe("passwordRequired");
    expect(schema.safeParse({ ...validUser, password: "123456" }).success).toBe(true);
  });

  it("allows missing password when requirePassword is false", () => {
    const schema = buildUserFormSchema({ requirePassword: false });
    expect(schema.safeParse({ ...validUser, password: "" }).success).toBe(true);
    expect(
      schema.safeParse({
        name: validUser.name,
        username: validUser.username,
        email: validUser.email,
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
        email: "maria@example.com",
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

  it("allows null code on create", () => {
    expect(
      createUserFormSchema(existingUsers).parse({
        ...validUser,
        code: null,
      }),
    ).toMatchObject({ code: null });
  });

  it("allows multiple users without a code", () => {
    const withNullCode = [
      ...existingUsers,
      { documentId: "u3", code: null, username: "ana.1" },
    ];
    expect(
      createUserFormSchema(withNullCode).parse({
        ...validUser,
        code: null,
        username: "pedro.1",
      }),
    ).toMatchObject({ code: null });
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

  it("rejects duplicate email on create", () => {
    const withEmail = [
      ...existingUsers,
      {
        documentId: "u3",
        code: 2,
        username: "joao.2",
        email: "joao@example.com",
      },
    ];
    const result = createUserFormSchema(withEmail).safeParse({
      ...validUser,
      email: "joao@example.com",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe(USER_EMAIL_NOT_UNIQUE_KEY);
  });

  it("allows editing a user to a new unique pixtrela.local email", () => {
    const withLocalEmail = [
      {
        documentId: "u1",
        code: 1234,
        username: "ana.123",
        email: "ana@pixtrela.local",
      },
      {
        documentId: "u2",
        code: 5678,
        username: "joao.5678",
        email: "joao@pixtrela.local",
      },
    ];

    expect(
      createUserFormSchema(withLocalEmail, "u1").parse({
        ...validUser,
        username: "ana.123",
        email: "ana.123@pixtrela.locals",
        code: 1234,
      }),
    ).toMatchObject({ email: "ana.123@pixtrela.locals" });
  });
});
