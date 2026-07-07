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
  { item: { href: "/", labelKey: "panel" }, show: () => true },
  { item: { href: "/board", labelKey: "board" }, show: (r) => r !== "colaborator" },
  {
    item: { href: "/tasks", labelKey: "tasks" },
    show: (r) => r === "admin" || r === "manager" || r === "leader",
  },
  { item: { href: "/templates", labelKey: "templates" }, show: (r) => RANK[r] >= RANK.leader },
  { item: { href: "/teams", labelKey: "teams" }, show: (r) => RANK[r] >= RANK.manager },
  { item: { href: "/awards", labelKey: "awards" }, show: (r) => RANK[r] >= RANK.manager },
  { item: { href: "/users", labelKey: "users" }, show: (r) => RANK[r] >= RANK.leader },
  { item: { href: "/settings", labelKey: "settings" }, show: (r) => r === "admin" },
];

/**
 * Navigation items a given role is allowed to see.
 */
export function navItemsForRole(role: Role): NavItem[] {
  if (role === "kiosk") return [];
  return NAV_RULES.filter((rule) => rule.show(role)).map((rule) => rule.item);
}
