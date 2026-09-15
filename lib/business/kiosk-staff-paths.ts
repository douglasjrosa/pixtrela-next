import type { StaffNavPaths } from "@/lib/auth/nav";

/** Client-safe URL builders for the kiosk staff area. */

export function staffPanelPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}`;
}

export function staffBoardPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/board`;
}

export function staffTasksPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/tasks`;
}

export function staffQueuesPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/queues`;
}

export function staffTeamsPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/teams`;
}

export function staffUsersPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/users`;
}

export function staffAwardsPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/awards`;
}

export function staffExchangesPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/exchanges`;
}

export function staffSettingsPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/settings/files`;
}

export function staffTemplatesTasksPath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/templates/tasks`;
}

export function kioskStaffNavPaths(staffUserId: string): StaffNavPaths {
  return {
    panel: staffPanelPath(staffUserId),
    board: staffBoardPath(staffUserId),
    tasks: staffTasksPath(staffUserId),
    queues: staffQueuesPath(staffUserId),
    awards: staffAwardsPath(staffUserId),
    settings: staffSettingsPath(staffUserId),
  };
}

export function staffQueueColaboratorPath(
  staffUserId: string,
  colaboratorId: string,
): string {
  return `/kiosk/staff/${staffUserId}/queues/${colaboratorId}`;
}

export function staffProfilePath(staffUserId: string): string {
  return `/kiosk/staff/${staffUserId}/profile`;
}
