"use server";

import { revalidateTag } from "next/cache";

import { isDrizzleBackend } from "@/lib/db/backend";
import { createTeam, listTeams } from "@/lib/repos/teams";
import {
  createTemplateTask,
  findTemplateByCode,
} from "@/lib/repos/templates";

export async function listTeamsAction() {
  if (!isDrizzleBackend()) {
    throw new Error("listTeamsAction requires DATA_BACKEND=drizzle");
  }
  return listTeams();
}

export async function createTeamAction(input: {
  name: string;
  leaderId?: string | null;
  memberIds?: string[];
  exchangesFirstDay?: number;
  exchangesLastDay?: number;
}) {
  if (!isDrizzleBackend()) {
    throw new Error("createTeamAction requires DATA_BACKEND=drizzle");
  }
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
  if (!isDrizzleBackend()) {
    throw new Error("createTemplateTaskAction requires DATA_BACKEND=drizzle");
  }
  const template = await createTemplateTask(input);
  revalidateTag("drizzle:templates", "default");
  return template;
}

export async function lookupTemplateByCodeAction(code: string) {
  if (!isDrizzleBackend()) {
    throw new Error("lookupTemplateByCodeAction requires DATA_BACKEND=drizzle");
  }
  return findTemplateByCode(code);
}
