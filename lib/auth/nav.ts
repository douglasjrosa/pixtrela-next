import { canAccessOwnProfile } from "./profile-access";

export type Role = "admin" | "manager" | "leader" | "colaborator" | "kiosk";

export interface NavItem {
  href: string;
  labelKey: string;
}

const RANK: Record<Role, number> = {
  kiosk: 0,
  colaborator: 1,
  leader: 2,
  manager: 3,
  admin: 4,
};

interface NavRule {
  item: NavItem;
  show: (role: Role) => boolean;
}

const NAV_RULES: NavRule[] = [
  { item: { href: "/", labelKey: "panel" }, show: (r) => r !== "colaborator" },
  { item: { href: "/board", labelKey: "board" }, show: (r) => r !== "colaborator" },
  {
    item: { href: "/tasks", labelKey: "tasks" },
    show: (r) => r === "admin" || r === "manager" || r === "leader",
  },
  {
    item: { href: "/templates/tasks", labelKey: "templates" },
    show: (r) => RANK[r] >= RANK.manager,
  },
  { item: { href: "/teams", labelKey: "teams" }, show: (r) => RANK[r] >= RANK.manager },
  { item: { href: "/awards", labelKey: "awards" }, show: (r) => RANK[r] >= RANK.manager },
  {
    item: { href: "/exchanges", labelKey: "exchange" },
    show: (r) => RANK[r] >= RANK.leader,
  },
  { item: { href: "/users", labelKey: "users" }, show: (r) => RANK[r] >= RANK.leader },
  {
    item: { href: "/settings/files", labelKey: "settings" },
    show: (r) => r === "admin",
  },
];

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

  const items = NAV_RULES.filter((rule) => rule.show(role)).map(
    (rule) => rule.item,
  );
  if (canAccessOwnProfile(role) && options.userId) {
    items.push({
      href: `/${options.userId}/profile`,
      labelKey: "profile",
    });
  }
  return items;
}
