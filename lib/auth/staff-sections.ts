import type { Role } from "./nav";
import {
  canManageTasks,
  canManageTemplates,
  canManageTeams,
  canViewAwards,
  canViewExchanges,
  canViewQueues,
  canViewUsers,
  canViewActivities,
} from "./permissions";

export interface StaffSectionTab {
  href: string;
  label: string;
  activePrefix?: string;
}

export interface StaffSectionLabels {
  tasks: string;
  templates: string;
  queues: string;
  teams: string;
  users: string;
  activities: string;
  awards: string;
  exchanges: string;
}

export interface TasksSectionPaths {
  tasks: string;
  templates: string;
}

export interface TeamsSectionPaths {
  queues: string;
  teams: string;
  users: string;
  activities: string;
}

export interface AwardsSectionPaths {
  awards: string;
  exchanges: string;
}

export function tasksSectionTabs(
  role: Role | undefined,
  labels: StaffSectionLabels,
  paths: TasksSectionPaths,
): StaffSectionTab[] {
  const tabs: StaffSectionTab[] = [];
  if (canManageTasks(role)) {
    tabs.push({
      href: paths.tasks,
      label: labels.tasks,
      activePrefix: paths.tasks,
    });
  }
  if (canManageTemplates(role)) {
    tabs.push({
      href: paths.templates,
      label: labels.templates,
      activePrefix: paths.templates.replace(/\/tasks$/, ""),
    });
  }
  return tabs;
}

export function teamsSectionTabs(
  role: Role | undefined,
  labels: StaffSectionLabels,
  paths: TeamsSectionPaths,
): StaffSectionTab[] {
  const tabs: StaffSectionTab[] = [];
  if (canViewQueues(role)) {
    tabs.push({
      href: paths.queues,
      label: labels.queues,
      activePrefix: paths.queues,
    });
  }
  if (canManageTeams(role)) {
    tabs.push({
      href: paths.teams,
      label: labels.teams,
      activePrefix: paths.teams,
    });
  }
  if (canViewUsers(role)) {
    tabs.push({
      href: paths.users,
      label: labels.users,
      activePrefix: paths.users,
    });
  }
  if (canViewActivities(role)) {
    tabs.push({
      href: paths.activities,
      label: labels.activities,
      activePrefix: paths.activities,
    });
  }
  return tabs;
}

export function awardsSectionTabs(
  role: Role | undefined,
  labels: StaffSectionLabels,
  paths: AwardsSectionPaths,
): StaffSectionTab[] {
  const tabs: StaffSectionTab[] = [];
  if (canViewAwards(role)) {
    tabs.push({
      href: paths.awards,
      label: labels.awards,
      activePrefix: paths.awards,
    });
  }
  if (canViewExchanges(role)) {
    tabs.push({
      href: paths.exchanges,
      label: labels.exchanges,
      activePrefix: paths.exchanges,
    });
  }
  return tabs;
}
