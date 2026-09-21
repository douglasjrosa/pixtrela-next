import type { Role } from "@/lib/auth/nav";

export type KioskIdentifiedRole = Extract<
  Role,
  "colaborator" | "admin" | "manager" | "leader"
>;

export function resolveKioskPathAfterIdentify(
  documentId: string,
  role: KioskIdentifiedRole,
): string {
  if (role === "colaborator") return `/kiosk/${documentId}`;
  return `/kiosk/staff/${documentId}`;
}

export function isKioskIdentifiedRole(role: string): role is KioskIdentifiedRole {
  return (
    role === "colaborator" ||
    role === "admin" ||
    role === "manager" ||
    role === "leader"
  );
}

export function resolveKioskPathForIdentifiedUser(
  documentId: string,
  role: string | undefined,
): string {
  if (role && isKioskIdentifiedRole(role)) {
    return resolveKioskPathAfterIdentify(documentId, role);
  }
  return `/kiosk/${documentId}`;
}

export function isStaffKioskRole(role: KioskIdentifiedRole): boolean {
  return role !== "colaborator";
}
