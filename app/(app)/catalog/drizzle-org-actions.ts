"use server";

import { revalidateTag } from "next/cache";

import { createTeam, listTeams } from "@/lib/repos/teams";
import {
  createTemplateTask,
  findTemplateByCode,
} from "@/lib/repos/templates";

export async function listTeamsAction() {
  return listTeams();
}

export async function createTeamAction(input: {
  name: string;
  leaderId?: string | null;
  memberIds?: string[];
  exchangesFirstDay?: number;
  exchangesLastDay?: number;
}) {
  const team = await createTeam(input);
  revalidateTag("drizzle:teams", "default");
  return team;
}

export async function createTemplateTaskAction(input: {
  code: string;
  name: string;
  subTasks?: Array<{
    name: string;
    expectedTime?: number;
    index?: number;
    dependencyIndexes?: number[];
  }>;
}) {
  const template = await createTemplateTask(input);
  revalidateTag("drizzle:templates", "default");
  return template;
}

export async function lookupTemplateByCodeAction(code: string) {
  return findTemplateByCode(code);
}
