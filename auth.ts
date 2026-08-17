import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { verifyLoginTicket } from "./lib/auth/login-ticket";
import { toBrowserMediaUrl } from "./lib/media/browser-media-url";
import {
  authenticateUser,
  findUserAvatarUrl,
  findUserById,
} from "./lib/repos/users";
import { loginSchema } from "./lib/schemas/auth";
import { loginTicketCredentialSchema } from "./lib/schemas/auth-identify";

async function authorizeWithPassword(login: string, password: string) {
  const user = await authenticateUser(login, password);
  if (!user) return null;
  const avatarUrl = await findUserAvatarUrl(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jwt: "",
    role: user.role,
    avatarUrl: toBrowserMediaUrl(avatarUrl),
  };
}

async function authorizeWithLoginTicket(loginTicket: string) {
  const userId = verifyLoginTicket(loginTicket);
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user || user.blocked || !user.active) return null;
  const avatarUrl = await findUserAvatarUrl(user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    jwt: "",
    role: user.role,
    avatarUrl: toBrowserMediaUrl(avatarUrl),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        login: {},
        password: {},
        loginTicket: {},
      },
      async authorize(credentials) {
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
