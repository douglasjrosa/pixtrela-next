import type { UserFormInput } from "@/lib/schemas/user";

const PIXTRELA_EMAIL_DOMAIN = "pixtrela.local";

export function deriveUserEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${PIXTRELA_EMAIL_DOMAIN}`;
}

/** Payload for Strapi POST /users (role resolved server-side from roleType). */
export function buildCreateUserPayload(data: UserFormInput): Record<string, unknown> {
  return {
    username: data.username,
    email: data.email,
    password: data.password,
    name: data.name,
    code: data.code,
    roleType: data.roleType,
    confirmed: true,
    ...(data.greetingGender
      ? { greetingGender: data.greetingGender }
      : {}),
  };
}

/** Partial payload for PUT /users when role changes. */
export function buildUpdateUserPayload(
  data: Partial<UserFormInput>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name) payload.name = data.name;
  if (data.username) payload.username = data.username;
  if (data.email) payload.email = data.email;
  if (data.password) payload.password = data.password;
  if (data.code !== undefined) payload.code = data.code;
  if (data.roleType) payload.roleType = data.roleType;
  if (data.greetingGender !== undefined) {
    payload.greetingGender = data.greetingGender;
  }
  return payload;
}
