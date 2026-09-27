import type { Role } from "@/lib/auth/nav";

/** Staff who may open the totem team-access screen. Not `canViewUsers`. */
export function canManageColaboratorCredentialsOnKiosk(
  role: Role | undefined,
): boolean {
  return role === "leader" || role === "manager" || role === "admin";
}

/** Password/face of another person: kiosk device session only. */
export function canEditOtherPersonCredentialsOnKiosk(
  sessionRole: Role | string | undefined,
): boolean {
  return sessionRole === "kiosk";
}
