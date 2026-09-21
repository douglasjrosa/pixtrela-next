import {
  staffAwardsPath,
  staffExchangesPath,
  staffQueuesPath,
  staffTasksPath,
  staffTeamsPath,
  staffTemplatesTasksPath,
  staffUsersPath,
  staffActivitiesPath,
} from "@/lib/business/kiosk-staff-paths";

import {
  loadAwardsSectionTabs,
  loadTasksSectionTabs,
  loadTeamsSectionTabs,
} from "./load-staff-section-tabs";
import type { Role } from "./nav";

export async function loadKioskTasksSectionTabs(
  role: Role | undefined,
  staffUserId: string,
) {
  return loadTasksSectionTabs(role, {
    tasks: staffTasksPath(staffUserId),
    templates: staffTemplatesTasksPath(staffUserId),
  });
}

export async function loadKioskTeamsSectionTabs(
  role: Role | undefined,
  staffUserId: string,
) {
  return loadTeamsSectionTabs(role, {
    queues: staffQueuesPath(staffUserId),
    teams: staffTeamsPath(staffUserId),
    users: staffUsersPath(staffUserId),
    activities: staffActivitiesPath(staffUserId),
  });
}

export async function loadKioskAwardsSectionTabs(
  role: Role | undefined,
  staffUserId: string,
) {
  return loadAwardsSectionTabs(role, {
    awards: staffAwardsPath(staffUserId),
    exchanges: staffExchangesPath(staffUserId),
  });
}
