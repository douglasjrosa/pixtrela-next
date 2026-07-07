import type { Role } from "./nav";

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

export function canColaboratorAccessPath(
  pathname: string,
  documentId: string,
): boolean {
  return pathname === `/${documentId}`;
}

interface RouteAccessInput {
  isAuthenticated: boolean;
  role?: Role;
  userId?: string;
}

/**
 * Resolves middleware access for all roles.
 * Kiosk: only /kiosk and /kiosk/* when authenticated as kiosk.
 * Colaborator: only /[ownDocumentId].
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
      return {
        action: "redirect",
        destination: buildLoginRedirect(KIOSK_HOME_PATH),
      };
    }
    if (isKiosk) {
      return { action: "allow" };
    }
    if (role === "admin" && isKioskPanelPath(pathname)) {
      return { action: "allow" };
    }
    if (isColaborator && userId) {
      return { action: "redirect", destination: `/${userId}` };
    }
    return { action: "redirect", destination: "/" };
  }

  if (isColaboratorPrivatePath(pathname)) {
    if (!isAuthenticated) {
      return { action: "redirect", destination: LOGIN_PATH };
    }
    if (isKiosk) {
      return { action: "redirect", destination: KIOSK_HOME_PATH };
    }
    if (isColaborator && userId && pathname !== `/${userId}`) {
      return { action: "redirect", destination: `/${userId}` };
    }
    if (!isColaborator && isAuthenticated) {
      return { action: "redirect", destination: "/" };
    }
    return { action: "allow" };
  }

  if (isKiosk) {
    return { action: "redirect", destination: KIOSK_HOME_PATH };
  }

  if (isColaborator) {
    if (!isAuthenticated) {
      return { action: "redirect", destination: LOGIN_PATH };
    }
    if (pathname === "/") {
      return { action: "allow" };
    }
    if (userId) {
      return { action: "redirect", destination: `/${userId}` };
    }
    return { action: "redirect", destination: LOGIN_PATH };
  }

  if (!isAuthenticated) {
    return { action: "redirect", destination: LOGIN_PATH };
  }

  return { action: "allow" };
}
