import { describe, expect, it } from "vitest";

import {
  isColaboratorPrivatePath,
  isUserProfilePath,
  resolveRouteAccess,
  type RouteAccessDecision,
} from "./colaborator-routes";
import type { Role } from "./nav";
import { resolvePostLoginDestination } from "./post-login-destination";
import { canAccessOwnProfile } from "./profile-access";
import { buildProfilePath } from "@/lib/profile/profile-path";

type AccessInput = {
  isAuthenticated: boolean;
  role?: Role;
  userId?: string;
};

function pathnameOf(destination: string): string {
  const q = destination.indexOf("?");
  return q === -1 ? destination : destination.slice(0, q);
}

/**
 * Mirrors app/[documentId]/page.tsx and profile/page.tsx redirects after
 * middleware allows the request.
 */
function resolvePageRedirect(
  pathname: string,
  input: AccessInput,
): string | null {
  if (isUserProfilePath(pathname)) {
    if (!input.userId || !canAccessOwnProfile(input.role)) return "/";
    const own = buildProfilePath(input.userId);
    if (pathname !== own) return own;
    return null;
  }
  if (isColaboratorPrivatePath(pathname)) {
    if (input.role !== "colaborator") return "/";
    if (input.userId && pathname !== `/${input.userId}`) {
      return `/${input.userId}`;
    }
    return null;
  }
  return null;
}

/** Follow middleware (+ optional page) redirects until settle or loop. */
function followRedirects(
  startPath: string,
  input: AccessInput,
  options: { includePageRedirects?: boolean; maxHops?: number } = {},
): { chain: string[]; decision: RouteAccessDecision | null; looped: boolean } {
  const maxHops = options.maxHops ?? 8;
  const chain = [startPath];
  let path = startPath;

  for (let hop = 0; hop < maxHops; hop += 1) {
    const decision = resolveRouteAccess(path, input);
    if (decision.action === "redirect") {
      const next = pathnameOf(decision.destination);
      if (next === path || chain.includes(next)) {
        return { chain: [...chain, next], decision, looped: true };
      }
      chain.push(next);
      path = next;
      continue;
    }

    if (options.includePageRedirects) {
      const pageNext = resolvePageRedirect(path, input);
      if (pageNext) {
        if (pageNext === path || chain.includes(pageNext)) {
          return { chain: [...chain, pageNext], decision, looped: true };
        }
        chain.push(pageNext);
        path = pageNext;
        continue;
      }
    }

    return { chain, decision, looped: false };
  }

  return { chain, decision: null, looped: true };
}

const ROLES: Array<{ role: Role; userId: string }> = [
  { role: "admin", userId: "admin-1" },
  { role: "manager", userId: "mgr-1" },
  { role: "leader", userId: "lead-1" },
  { role: "colaborator", userId: "col-1" },
  { role: "kiosk", userId: "kiosk-1" },
];

const PATHS = [
  "/",
  "/login",
  "/board",
  "/kiosk",
  "/kiosk/col-1",
  "/col-1",
  "/col-1/profile",
  "/mgr-1/profile",
  "/lead-1/profile",
  "/admin-1/profile",
  "/other",
  "/other/profile",
  "/users",
  "/settings/steps",
];

describe("resolveRouteAccess redirect stability", () => {
  it("never loops for unauthenticated users", () => {
    for (const path of PATHS) {
      const result = followRedirects(path, { isAuthenticated: false });
      expect(result.looped, path).toBe(false);
      expect(result.chain.length).toBeLessThanOrEqual(2);
    }
  });

  it("never loops for authenticated roles on common paths", () => {
    for (const { role, userId } of ROLES) {
      for (const path of PATHS) {
        const result = followRedirects(path, {
          isAuthenticated: true,
          role,
          userId,
        });
        expect(result.looped, `${role} ${path} -> ${result.chain.join(" => ")}`).toBe(
          false,
        );
      }
    }
  });

  it("post-login destinations settle without middleware bounce loops", () => {
    const callbacks = [
      null,
      "/board",
      "/kiosk",
      "/login",
      "/col-1",
      "/mgr-1/profile",
      "/login?callbackUrl=%2Fkiosk",
    ];

    for (const { role, userId } of ROLES) {
      for (const callbackUrl of callbacks) {
        const destination = resolvePostLoginDestination(
          role,
          userId,
          callbackUrl,
        );
        const start = pathnameOf(destination);
        const result = followRedirects(start, {
          isAuthenticated: true,
          role,
          userId,
        });
        expect(
          result.looped,
          `${role} cb=${callbackUrl} dest=${destination} chain=${result.chain.join("=>")}`,
        ).toBe(false);
      }
    }
  });

  it("never loops when page redirects run after middleware", () => {
    for (const { role, userId } of ROLES) {
      for (const path of PATHS) {
        const result = followRedirects(
          path,
          { isAuthenticated: true, role, userId },
          { includePageRedirects: true },
        );
        expect(
          result.looped,
          `${role} ${path} -> ${result.chain.join(" => ")}`,
        ).toBe(false);
      }
    }
  });

  it("post-login settles without a middleware bounce hop", () => {
    const cases: Array<{
      role: Role;
      userId: string;
      callbackUrl: string | null;
      expected: string;
    }> = [
      { role: "kiosk", userId: "k1", callbackUrl: "/board", expected: "/kiosk" },
      {
        role: "colaborator",
        userId: "c1",
        callbackUrl: "/kiosk",
        expected: "/c1",
      },
      { role: "manager", userId: "m1", callbackUrl: "/kiosk", expected: "/" },
      { role: "manager", userId: "m1", callbackUrl: "/board", expected: "/board" },
      { role: "admin", userId: "a1", callbackUrl: "/login", expected: "/" },
    ];

    for (const { role, userId, callbackUrl, expected } of cases) {
      const destination = resolvePostLoginDestination(role, userId, callbackUrl);
      expect(destination, `${role} ${callbackUrl}`).toBe(expected);
      const result = followRedirects(pathnameOf(destination), {
        isAuthenticated: true,
        role,
        userId,
      });
      expect(result.looped).toBe(false);
      expect(result.chain).toEqual([expected]);
    }
  });
});
