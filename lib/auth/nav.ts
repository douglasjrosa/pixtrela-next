import {
  canManageSettings,
  canManageTasks,
  canMoveBoardTasks,
  canViewAwards,
  canViewQueues,
} from "./permissions";

export type Role = "admin" | "manager" | "leader" | "colaborator" | "kiosk";

export interface NavItem {
  href: string;
  labelKey: string;
}

export interface ResolvedNavItem {
  href: string;
  label: string;
}

export interface StaffNavPaths {
  panel: string;
  board: string;
  tasks: string;
  queues: string;
  awards: string;
  settings: string;
}

export const APP_STAFF_NAV_PATHS: StaffNavPaths = {
  panel: "/",
  board: "/board",
  tasks: "/tasks",
  queues: "/queues",
  awards: "/awards",
  settings: "/settings/logs",
};

interface NavRule {
  item: NavItem;
  show: (role: Role) => boolean;
}

function isStaffRole(role: Role): boolean {
  return role !== "colaborator" && role !== "kiosk";
}

function staffNavRules(paths: StaffNavPaths): NavRule[] {
  return [
    { item: { href: paths.panel, labelKey: "panel" }, show: isStaffRole },
    { item: { href: paths.board, labelKey: "board" }, show: canMoveBoardTasks },
    {
      item: { href: paths.tasks, labelKey: "tasks" },
      show: (role) => canManageTasks(role),
    },
    {
      item: { href: paths.queues, labelKey: "teams" },
      show: (role) => canViewQueues(role),
    },
    {
      item: { href: paths.awards, labelKey: "awards" },
      show: (role) => canViewAwards(role),
    },
    {
      item: { href: paths.settings, labelKey: "settings" },
      show: (role) => canManageSettings(role),
    },
  ];
}

export interface NavItemsOptions {
  userId?: string;
}

/** Primary colaborator header links (dashboard + store). */
export function colaboratorMenuItems(userId: string): NavItem[] {
  return [
    { href: `/${userId}`, labelKey: "dashboard" },
    { href: `/${userId}/store`, labelKey: "store" },
    { href: `/${userId}/orders`, labelKey: "exchange" },
  ];
}

/** Brand / home destination after login for the role. */
export function homeHrefForRole(role: Role, userId?: string): string {
  if (role === "kiosk") return "/kiosk";
  if (role === "colaborator" && userId) return `/${userId}`;
  return "/";
}

/**
 * Navigation items a given role is allowed to see.
 */
export function navItemsForRole(
  role: Role,
  options: NavItemsOptions = {},
): NavItem[] {
  if (role === "kiosk") return [];

  if (role === "colaborator") {
    const { userId } = options;
    if (!userId) {
      return [{ href: "/", labelKey: "panel" }];
    }
    return [
      { href: `/${userId}`, labelKey: "dashboard" },
      { href: `/${userId}/store`, labelKey: "store" },
      { href: `/${userId}/orders`, labelKey: "exchange" },
      { href: `/${userId}/profile`, labelKey: "profile" },
    ];
  }

  return staffNavItemsForRole(role, APP_STAFF_NAV_PATHS);
}

/** Top-level staff navbar items (web or kiosk paths). */
export function staffNavItemsForRole(
  role: Role,
  paths: StaffNavPaths,
): NavItem[] {
  return staffNavRules(paths)
    .filter((rule) => rule.show(role))
    .map((rule) => rule.item);
}

export function resolveNavItemLabels(
  items: NavItem[],
  labels: Record<string, string>,
): ResolvedNavItem[] {
  return items.map((item) => ({
    href: item.href,
    label: labels[item.labelKey] ?? item.labelKey,
  }));
}
