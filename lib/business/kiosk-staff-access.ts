import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks, canMoveBoardTasks } from "@/lib/auth/permissions";
import { assertStaffCanManageColaborator } from "@/lib/repos/kiosk";
import { findUserById } from "@/lib/repos/users";

import type { KioskIdentifiedRole } from "./kiosk-identify-route";

export type KioskStaffRole = Extract<Role, "admin" | "manager" | "leader">;

export type KioskStaffActor = {
  staffUserId: string;
  staffRole: KioskStaffRole;
  name: string;
  avatarUrl: string | null;
};

const STAFF_ROLES = new Set<KioskStaffRole>(["admin", "manager", "leader"]);

/** Admin and manager may sign out the kiosk device from the totem staff area. */
export function canKioskSignOutDevice(
  role: KioskIdentifiedRole | Role | undefined,
): boolean {
  return role === "admin" || role === "manager";
}

export function isKioskStaffRole(
  role: string | undefined,
): role is KioskStaffRole {
  return Boolean(role && STAFF_ROLES.has(role as KioskStaffRole));
}

export function canKioskStaffAccessBoard(
  role: KioskStaffRole | Role | undefined,
): boolean {
  return canMoveBoardTasks(role);
}

export function canKioskStaffManageBoardSubtasks(
  role: KioskStaffRole | Role | undefined,
): boolean {
  return canManageTasks(role);
}

export async function assertKioskDeviceSession(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "kiosk") {
    throw new Error("forbidden");
  }
}

export async function loadKioskStaffActor(
  staffUserId: string,
): Promise<KioskStaffActor | null> {
  const user = await findUserById(staffUserId);
  if (!user || user.blocked || !user.active) return null;
  if (!isKioskStaffRole(user.role)) return null;
  return {
    staffUserId: user.id,
    staffRole: user.role,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
  };
}

/** Device must be kiosk; URL staff must be an active leader+. */
export async function assertKioskStaffActor(
  staffUserId: string,
): Promise<KioskStaffActor> {
  await assertKioskDeviceSession();
  const actor = await loadKioskStaffActor(staffUserId);
  if (!actor) throw new Error("forbidden");
  return actor;
}

export async function assertKioskStaffCanManageColaborator(
  staffUserId: string,
  colaboratorId: string,
): Promise<KioskStaffActor> {
  const actor = await assertKioskStaffActor(staffUserId);
  await assertStaffCanManageColaborator(staffUserId, colaboratorId);
  return actor;
}

