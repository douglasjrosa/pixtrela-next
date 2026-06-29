import {
  canColaboratorAccessPath,
  isColaboratorPrivatePath,
  isKioskPath,
} from "./colaborator-routes";
import type { Role } from "./nav";

const RANK: Record<Role, number> = {
  kiosk: 0,
  colaborator: 1,
  leader: 2,
  manager: 3,
  admin: 4,
};
function isAtLeast(role: Role | undefined, minimum: Role): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[minimum];
}

/** Task/template/step management: admin, manager, leader. */
export function canManageTasks(role: Role | undefined): boolean {
  return isAtLeast(role, "leader");
}

export function canManageTemplates(role: Role | undefined): boolean {
  return isAtLeast(role, "leader");
}

export function canManageSteps(role: Role | undefined): boolean {
  return isAtLeast(role, "leader");
}

/** Hard delete tasks: admin only (others may deactivate). */
export function canDeleteTasks(role: Role | undefined): boolean {
  return role === "admin";
}

/** Team CRUD: admin and manager. */
export function canManageTeams(role: Role | undefined): boolean {
  return role === "admin" || role === "manager";
}

/** Award CRUD: admin only. */
export function canManageAwards(role: Role | undefined): boolean {
  return role === "admin";
}

/** Settings (currency): admin only. */
export function canManageSettings(role: Role | undefined): boolean {
  return role === "admin";
}

/** Exchange Stars for awards: colaborator only. */
export function canExchange(role: Role | undefined): boolean {
  return role === "colaborator";
}

/** Own balance screen: colaborator only. */
export function canViewBalance(role: Role | undefined): boolean {
  return role === "colaborator";
}

/** Users screen: leader and above. */
export function canViewUsers(role: Role | undefined): boolean {
  return isAtLeast(role, "leader");
}

/** Copy kiosk deep link on user edit: admin and manager only. */
export function canCopyKioskLink(role: Role | undefined): boolean {
  return role === "admin" || role === "manager";
}

/** Set user password in create/edit form: admin only. */
export function canSetUserPassword(role: Role | undefined): boolean {
  return role === "admin";
}

/** Override auto-generated login in user form: admin only. */
export function canEditUserLogin(role: Role | undefined): boolean {
  return role === "admin";
}

/** Admin/manager see any screen; leader/colaborator are scoped. */
export function canViewAnyScreen(role: Role | undefined): boolean {
  return role === "admin" || role === "manager";
}

/** Move tasks on the board: leader and above. */
export function canMoveBoardTasks(role: Role | undefined): boolean {
  return isAtLeast(role, "leader");
}

const ROUTE_GUARDS: { prefix: string; check: (role: Role | undefined) => boolean }[] = [
  { prefix: "/balance", check: canViewBalance },
  { prefix: "/exchange", check: canExchange },
  { prefix: "/tasks", check: canManageTasks },
  { prefix: "/templates", check: canManageTemplates },
  { prefix: "/teams", check: (r) => canManageTeams(r) || r === "leader" },
  { prefix: "/awards", check: (r) => canManageAwards(r) || isAtLeast(r, "manager") },
  { prefix: "/settings", check: canManageSettings },
  { prefix: "/users", check: canViewUsers },
];

/** Whether role may access a route prefix (logged-in routes only). */
export function canAccessRoute(
  role: Role | undefined,
  pathname: string,
  userId?: string,
): boolean {
  if (role === "kiosk") {
    return isKioskPath(pathname);
  }

  if (role === "colaborator") {
    if (!userId) {
      return isColaboratorPrivatePath(pathname);
    }
    return canColaboratorAccessPath(pathname, userId);
  }
  const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.prefix));
  if (!guard) return true;
  return guard.check(role);
}
