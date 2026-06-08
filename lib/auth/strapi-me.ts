import { buildStrapiQuery } from "@/lib/strapi/query";

import type { Role } from "./nav";

const DEFAULT_ROLE: Role = "colaborator";

const ROLES = new Set<Role>([
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
]);

/** Strapi 5 REST query for /users/me with role.type populated. */
export function buildMeQueryString(): string {
  return buildStrapiQuery({
    populate: { role: { fields: ["type"] } },
  });
}

/**
 * Reads roleType from /auth/local user payload (sys-rbx pemission pattern).
 * Scalar field is always present in the login response.
 */
export function resolveRoleFromLoginUser(user: unknown): Role | null {
  if (!user || typeof user !== "object") return null;

  const roleType = (user as Record<string, unknown>).roleType;
  if (typeof roleType === "string" && ROLES.has(roleType as Role)) {
    return roleType as Role;
  }

  return null;
}

/** Reads role.type from Strapi /users/me (flat or { data } payload). */
export function resolveRoleFromMe(me: unknown): Role | null {
  if (!me || typeof me !== "object") return null;

  const root = me as Record<string, unknown>;
  const payload = root.data ?? root;
  if (!payload || typeof payload !== "object") return null;

  const role = (payload as Record<string, unknown>).role;
  if (!role || typeof role !== "object") return null;

  const type = (role as Record<string, unknown>).type;
  if (typeof type === "string" && ROLES.has(type as Role)) {
    return type as Role;
  }

  return null;
}

/** Prefer login user.roleType, then /users/me role.type, else colaborator. */
export function resolveSessionRole(loginUser: unknown, me: unknown): Role {
  return (
    resolveRoleFromLoginUser(loginUser) ??
    resolveRoleFromMe(me) ??
    DEFAULT_ROLE
  );
}
