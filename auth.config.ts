import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

import { resolveRouteAccess } from "@/lib/auth/colaborator-routes";
import type { Role } from "@/lib/auth/nav";
import { isAuthenticatedSession } from "@/lib/auth/session";

/**
 * Edge-safe Auth.js config shared with the middleware. Heavy logic (the
 * Credentials provider that calls Strapi) lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const isAuthenticated = isAuthenticatedSession(auth);
      const role = auth?.user?.role as Role | undefined;
      const userId = auth?.user?.id;

      const decision = resolveRouteAccess(pathname, {
        isAuthenticated,
        role,
        userId,
      });

      if (decision.action === "allow") {
        return true;
      }

      return NextResponse.redirect(new URL(decision.destination, request.nextUrl));
    },
    jwt({ token, user }) {
      if (user) {
        token.jwt = user.jwt;
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (!token.jwt || !token.role) {
        return session;
      }

      session.jwt = token.jwt as string;
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
