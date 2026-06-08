import type { Session } from "next-auth";

import type { Role } from "./nav";

export interface RoleGuardResult {
  allowed: boolean;
  role: Role | undefined;
}

/** Checks session role against allowed roles list. */
export function requireRole(
  session: Session | null,
  allowed: Role[],
): RoleGuardResult {
  const role = session?.user?.role as Role | undefined;
  return {
    allowed: Boolean(role && allowed.includes(role)),
    role,
  };
}

/** Checks session role with a predicate (e.g. canManageTasks). */
export function requirePermission(
  session: Session | null,
  check: (role: Role | undefined) => boolean,
): RoleGuardResult {
  const role = session?.user?.role as Role | undefined;
  return { allowed: check(role), role };
}
