import type { NavItem } from "@/lib/auth/nav";
import {
  staffQueuesPath,
  staffTeamAccessPath,
} from "@/lib/business/kiosk-staff-paths";

/** Totem staff chrome: queues + team credential access only. */
export function kioskStaffSlimNavItems(staffUserId: string): NavItem[] {
  return [
    { href: staffQueuesPath(staffUserId), labelKey: "queues" },
    { href: staffTeamAccessPath(staffUserId), labelKey: "teamAccess" },
  ];
}
