import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { isDrizzleBackend } from "./lib/db/backend";
import { isAuthStrapiFallbackEnabled } from "./lib/strapi/migration-guard";
import {
  buildMeQueryString,
  resolveRoleFromLoginUser,
  resolveSessionRole,
} from "./lib/auth/strapi-me";
import { verifyLoginTicket } from "./lib/auth/login-ticket";
import { authenticateUser, findUserById } from "./lib/repos/users";
import { loginSchema } from "./lib/schemas/auth";
import {
  jwtCredentialSchema,
  loginTicketCredentialSchema,
} from "./lib/schemas/auth-identify";
const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

async function authorizeWithJwt(jwt: string) {
  try {
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
  } catch {
    return null;
  }
}

async function authorizeWithPasswordStrapi(login: string, password: string) {
  try {
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
  } catch {
    return null;
  }
}

async function authorizeWithPasswordDrizzle(login: string, password: string) {
  const user = await authenticateUser(login, password);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jwt: "",
    role: user.role,
  };
}

async function authorizeWithLoginTicket(loginTicket: string) {
  const userId = verifyLoginTicket(loginTicket);
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user || user.blocked || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jwt: "",
    role: user.role,
  };
}
/**
 * Password auth:
 * - strapi backend → Strapi only
 * - drizzle + AUTH_STRAPI_FALLBACK=0 → Postgres only (cutover)
 * - drizzle + fallback on → prefer Strapi JWT for unmigrated pages, else Drizzle
 */
async function authorizeWithPassword(login: string, password: string) {
  if (!isDrizzleBackend()) {
    return authorizeWithPasswordStrapi(login, password);
  }

  if (!isAuthStrapiFallbackEnabled()) {
    return authorizeWithPasswordDrizzle(login, password);
  }

  const strapiUser = await authorizeWithPasswordStrapi(login, password);
  if (strapiUser) return strapiUser;
  return authorizeWithPasswordDrizzle(login, password);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        login: {},
        password: {},
        jwt: {},
        loginTicket: {},
      },
      async authorize(credentials) {
        const jwtParsed = jwtCredentialSchema.safeParse(credentials);
        if (jwtParsed.success) {
          if (isDrizzleBackend() && !isAuthStrapiFallbackEnabled()) {
            return null;
          }
          return authorizeWithJwt(jwtParsed.data.jwt);
        }

        const ticketParsed = loginTicketCredentialSchema.safeParse(credentials);
        if (ticketParsed.success) {
          return authorizeWithLoginTicket(ticketParsed.data.loginTicket);
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return authorizeWithPassword(parsed.data.login, parsed.data.password);
      },
    }),
  ],
});
