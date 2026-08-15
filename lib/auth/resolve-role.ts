import type { Role } from "./nav";

const DEFAULT_ROLE: Role = "colaborator";

const ROLES = new Set<Role>([
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
]);

export function resolveRoleFromStoredUser(user: {
  role?: Role | string | null;
} | null | undefined): Role {
  const role = user?.role;
  if (typeof role === "string" && ROLES.has(role as Role)) {
    return role as Role;
  }
  return DEFAULT_ROLE;
}
