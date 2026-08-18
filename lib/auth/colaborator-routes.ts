import {
  buildProfilePath,
  isUserProfilePath as isProfilePathShape,
} from "@/lib/profile/profile-path";
import {
  buildStorePath,
  isUserStorePath as isStorePathShape,
} from "@/lib/store/store-path";

import type { Role } from "./nav";
import { canAccessOwnProfile } from "./profile-access";

export const KIOSK_HOME_PATH = "/kiosk";
export const LOGIN_PATH = "/login";

export function buildLoginRedirect(callbackPath?: string): string {
  if (!callbackPath) return LOGIN_PATH;
  const params = new URLSearchParams({ callbackUrl: callbackPath });
  return `${LOGIN_PATH}?${params.toString()}`;
}

/** Fixed first-segment paths that are not collaborator private IDs. */
const RESERVED_ROOT_SEGMENTS = new Set([
  "login",
  "kiosk",
  "board",
  "balance",
  "exchange",
  "tasks",
  "templates",
  "teams",
  "users",
  "awards",
  "settings",
  "profile",
  "store",
  "api",
  "serwist",
]);

export type RouteAccessDecision =
  | { action: "allow" }
  | { action: "redirect"; destination: string };

export function isKioskHomePath(pathname: string): boolean {
  return pathname === KIOSK_HOME_PATH;
}

export function isKioskPanelPath(pathname: string): boolean {
  return (
    pathname.startsWith(`${KIOSK_HOME_PATH}/`) &&
    pathname !== KIOSK_HOME_PATH
  );
}

export function isKioskPath(pathname: string): boolean {
  return isKioskHomePath(pathname) || isKioskPanelPath(pathname);
}

/** True for `/{documentId}` (single dynamic segment, not a reserved app path). */
export function isColaboratorPrivatePath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  const segment = pathname.slice(1);
  if (!segment || segment.includes("/")) return false;
  return !RESERVED_ROOT_SEGMENTS.has(segment);
}

/** True for `/{documentId}/profile`. */
export function isUserProfilePath(pathname: string): boolean {
  return isProfilePathShape(pathname, RESERVED_ROOT_SEGMENTS);
}

/** True for `/{documentId}/store`. */
export function isUserStorePath(pathname: string): boolean {
  return isStorePathShape(pathname, RESERVED_ROOT_SEGMENTS);
}

export function canColaboratorAccessPath(
  pathname: string,
  documentId: string,
): boolean {
  return (
    pathname === `/${documentId}` ||
    pathname === buildProfilePath(documentId) ||
    pathname === buildStorePath(documentId)
  );
}

interface RouteAccessInput {
  isAuthenticated: boolean;
  role?: Role;
  userId?: string;
}

function redirectTo(destination: string, pathname: string): RouteAccessDecision {
  if (destination === pathname) return { action: "allow" };
  const destPath = destination.split("?")[0] ?? destination;
  if (destPath === pathname) return { action: "allow" };
  return { action: "redirect", destination };
}

/**
 * Resolves middleware access for all roles.
 * Kiosk: only /kiosk and /kiosk/* when authenticated as kiosk.
 * Colaborator: only /[ownDocumentId] (+ own profile).
 */
export function resolveRouteAccess(
  pathname: string,
  input: RouteAccessInput,
): RouteAccessDecision {
  const { isAuthenticated, role, userId } = input;
  const isColaborator = role === "colaborator";
  const isKiosk = role === "kiosk";

  if (pathname.startsWith(LOGIN_PATH)) {
    return { action: "allow" };
  }

  if (isKioskPath(pathname)) {
    if (!isAuthenticated) {
      return redirectTo(buildLoginRedirect(KIOSK_HOME_PATH), pathname);
    }
    if (isKiosk) {
      return { action: "allow" };
    }
    if (role === "admin" && isKioskPanelPath(pathname)) {
      return { action: "allow" };
    }
    if (isColaborator && userId) {
      return redirectTo(`/${userId}`, pathname);
    }
    return redirectTo("/", pathname);
  }

  if (isUserProfilePath(pathname)) {
    if (!isAuthenticated) {
      return redirectTo(buildLoginRedirect(pathname), pathname);
    }
    if (isKiosk) {
      return redirectTo(KIOSK_HOME_PATH, pathname);
    }
    if (!canAccessOwnProfile(role)) {
      return redirectTo("/", pathname);
    }
    if (userId && pathname !== buildProfilePath(userId)) {
      return redirectTo(buildProfilePath(userId), pathname);
    }
    return { action: "allow" };
  }

  if (isUserStorePath(pathname)) {
    if (!isAuthenticated) {
      return redirectTo(buildLoginRedirect(pathname), pathname);
    }
    if (isKiosk) {
      return redirectTo(KIOSK_HOME_PATH, pathname);
    }
    if (!isColaborator) {
      return redirectTo("/", pathname);
    }
    if (userId && pathname !== buildStorePath(userId)) {
      return redirectTo(buildStorePath(userId), pathname);
    }
    return { action: "allow" };
  }

  if (isColaboratorPrivatePath(pathname)) {
    if (!isAuthenticated) {
      return redirectTo(buildLoginRedirect(pathname), pathname);
    }
    if (isKiosk) {
      return redirectTo(KIOSK_HOME_PATH, pathname);
    }
    if (isColaborator && userId && pathname !== `/${userId}`) {
      return redirectTo(`/${userId}`, pathname);
    }
    if (!isColaborator && isAuthenticated) {
      return redirectTo("/", pathname);
    }
    return { action: "allow" };
  }

  if (isKiosk) {
    return redirectTo(KIOSK_HOME_PATH, pathname);
  }

  if (isColaborator) {
    if (!isAuthenticated) {
      return redirectTo(LOGIN_PATH, pathname);
    }
    if (pathname === "/") {
      return { action: "allow" };
    }
    if (userId) {
      return redirectTo(`/${userId}`, pathname);
    }
    return redirectTo(LOGIN_PATH, pathname);
  }

  if (!isAuthenticated) {
    return redirectTo(LOGIN_PATH, pathname);
  }

  return { action: "allow" };
}
