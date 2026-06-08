import type { Role } from "@/lib/auth/nav";

const MANAGEABLE_ROLES: Record<Role, Role[]> = {
  admin: ["manager", "leader", "colaborator", "kiosk"],
  manager: ["leader", "colaborator"],
  leader: ["colaborator"],
  colaborator: [],
  kiosk: [],
};

/** Roles the actor may assign when creating users (serializable for client props). */
export function manageableTargetRoles(actorRole: Role): Role[] {
  return MANAGEABLE_ROLES[actorRole] ?? [];
}

/** Whether actor may create/deactivate a user with targetRole. */
export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return MANAGEABLE_ROLES[actorRole]?.includes(targetRole) ?? false;
}

/** Only admin can hard-delete users. */
export function canDeleteUsers(actorRole: Role): boolean {
  return actorRole === "admin";
}
