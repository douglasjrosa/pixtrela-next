"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTeams } from "@/lib/auth/permissions";
import {
  createTeam as createTeamRepo,
  deleteTeam as deleteTeamRepo,
  updateTeam as updateTeamRepo,
} from "@/lib/repos/teams";
import { teamFormSchema, type TeamFormInput } from "@/lib/schemas/team";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTeams(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateTeams(): void {
  revalidateTag("drizzle:teams", "default");
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createTeam(raw: TeamFormInput): Promise<void> {
  await assertCanManage();
  const data = teamFormSchema.parse(raw);
  await createTeamRepo({
    name: data.name,
    leaderId: data.leaderDocumentId || null,
    exchangesFirstDay: data.exchangesFirstDay,
    exchangesLastDay: data.exchangesLastDay,
    memberIds: data.colaboratorDocumentIds ?? [],
    since: todayIsoDate(),
  });
  invalidateTeams();
}

export async function updateTeam(
  documentId: string,
  raw: TeamFormInput,
): Promise<void> {
  await assertCanManage();
  const data = teamFormSchema.parse(raw);
  await updateTeamRepo({
    id: documentId,
    name: data.name,
    leaderId: data.leaderDocumentId || null,
    exchangesFirstDay: data.exchangesFirstDay,
    exchangesLastDay: data.exchangesLastDay,
    until: data.untill?.trim() ? data.untill.trim() : null,
    memberIds: data.colaboratorDocumentIds ?? [],
  });
  invalidateTeams();
}

export async function deleteTeam(documentId: string): Promise<void> {
  await assertCanManage();
  await deleteTeamRepo(documentId);
  invalidateTeams();
}
