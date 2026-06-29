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

export function isStaffKioskRole(role: KioskIdentifiedRole): boolean {
  return role !== "colaborator";
}
