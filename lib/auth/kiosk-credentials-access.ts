import type { Role } from "@/lib/auth/nav";

/** Leader+ may change another person's password and face on the totem queue. */
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
