import { getTranslations } from "next-intl/server";

import type { Role } from "./nav";
import {
  awardsSectionTabs,
  tasksSectionTabs,
  teamsSectionTabs,
  type AwardsSectionPaths,
  type StaffSectionTab,
  type TasksSectionPaths,
  type TeamsSectionPaths,
} from "./staff-sections";

async function staffSectionLabels() {
  const t = await getTranslations("nav");
  return {
    tasks: t("tasks"),
    templates: t("templates"),
    queues: t("queues"),
    teams: t("teams"),
    users: t("users"),
    activities: t("activities"),
    awards: t("awards"),
    exchanges: t("exchange"),
  };
}

export async function loadTasksSectionTabs(
  role: Role | undefined,
  paths: TasksSectionPaths,
): Promise<StaffSectionTab[]> {
  const labels = await staffSectionLabels();
  return tasksSectionTabs(role, labels, paths);
}

export async function loadTeamsSectionTabs(
  role: Role | undefined,
  paths: TeamsSectionPaths,
): Promise<StaffSectionTab[]> {
  const labels = await staffSectionLabels();
  return teamsSectionTabs(role, labels, paths);
}

export async function loadAwardsSectionTabs(
  role: Role | undefined,
  paths: AwardsSectionPaths,
): Promise<StaffSectionTab[]> {
  const labels = await staffSectionLabels();
  return awardsSectionTabs(role, labels, paths);
}
