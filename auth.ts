import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { buildMeQueryString, resolveRoleFromLoginUser, resolveSessionRole } from "./lib/auth/strapi-me";
import { loginSchema } from "./lib/schemas/auth";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        login: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const loginRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: parsed.data.login,
            password: parsed.data.password,
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
      },
    }),
  ],
});
