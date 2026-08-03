import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import {
  buildMeQueryString,
  resolveRoleFromLoginUser,
  resolveSessionRole,
} from "./lib/auth/strapi-me";
import { loginSchema } from "./lib/schemas/auth";
import { jwtCredentialSchema } from "./lib/schemas/auth-identify";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

async function authorizeWithJwt(jwt: string) {
  const meRes = await fetch(
    `${STRAPI_URL}/api/users/me${buildMeQueryString()}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  if (!meRes.ok) return null;
  const me = await meRes.json();
  if (!me) return null;

  const role = resolveSessionRole(me, me);
  return {
    id: String(me.documentId ?? me.id),
    name: me.name ?? me.username,
    email: me.email ?? null,
    jwt,
    role,
  };
}

async function authorizeWithPassword(login: string, password: string) {
  const loginRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: login,
      password,
    }),
  });
  if (!loginRes.ok) return null;

  const data = await loginRes.json();
  if (!data?.jwt || !data?.user) return null;

  const loginRole = resolveRoleFromLoginUser(data.user);
  let me: unknown = null;
  if (!loginRole) {
    const meRes = await fetch(
      `${STRAPI_URL}/api/users/me${buildMeQueryString()}`,
      { headers: { Authorization: `Bearer ${data.jwt}` } },
    );
    me = meRes.ok ? await meRes.json() : null;
  }
  const role = resolveSessionRole(data.user, me);

  return {
    id: String(data.user.documentId ?? data.user.id),
    name: data.user.name ?? data.user.username,
    email: data.user.email ?? null,
    jwt: data.jwt,
    role,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        login: {},
        password: {},
        jwt: {},
      },
      async authorize(credentials) {
        const jwtParsed = jwtCredentialSchema.safeParse(credentials);
        if (jwtParsed.success) {
          return authorizeWithJwt(jwtParsed.data.jwt);
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return authorizeWithPassword(parsed.data.login, parsed.data.password);
      },
    }),
  ],
});
