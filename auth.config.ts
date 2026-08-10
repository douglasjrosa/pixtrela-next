import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

import { resolveRouteAccess } from "@/lib/auth/colaborator-routes";
import { isServerActionRequest } from "@/lib/auth/is-server-action-request";
import type { Role } from "@/lib/auth/nav";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";
import {
  isAuthenticatedSession,
  SESSION_EXPIRED_QUERY,
} from "@/lib/auth/session";

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
      // Server Actions must not be redirected here: a 307/HTML response breaks
      // the flight payload ("An unexpected response was received from the
      // server"). Actions enforce auth themselves.
      if (isServerActionRequest(request)) {
        return true;
      }

      const pathname = request.nextUrl.pathname;
      const isAuthenticated = isAuthenticatedSession(auth);
      const role = auth?.user?.role as Role | undefined;
      const userId = auth?.user?.id;
      const sessionExpiredReason =
        request.nextUrl.searchParams.get("reason") === SESSION_EXPIRED_QUERY;

      if (
        pathname.startsWith("/login") &&
        isAuthenticated &&
        !sessionExpiredReason
      ) {
        const destination = resolvePostLoginDestination(
          role,
          userId,
          request.nextUrl.searchParams.get("callbackUrl"),
        );
        if (destination.split("?")[0] !== pathname) {
          return NextResponse.redirect(new URL(destination, request.nextUrl));
        }
        return true;
      }

      const decision = resolveRouteAccess(pathname, {
        isAuthenticated,
        role,
        userId,
      });

      if (decision.action === "allow") {
        return true;
      }

      const destPath = decision.destination.split("?")[0] ?? decision.destination;
      if (destPath === pathname) {
        return true;
      }

      return NextResponse.redirect(
        new URL(decision.destination, request.nextUrl),
      );
    },
    jwt({ token, user }) {
      if (user) {
        token.jwt = user.jwt ?? "";
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (!token.role || !token.id) {
        return session;
      }

      session.jwt = typeof token.jwt === "string" ? token.jwt : "";
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
