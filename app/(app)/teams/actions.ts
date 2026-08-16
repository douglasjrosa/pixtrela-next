"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTeams,
  canDeleteTeams,
  canManageTeams,
} from "@/lib/auth/permissions";
import {
  createTeam as createTeamRepo,
  deleteTeam as deleteTeamRepo,
  findTeamById,
  hardDeleteTeam,
  updateTeam as updateTeamRepo,
} from "@/lib/repos/teams";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import { teamFormSchema, bulkTeamIdsSchema, type TeamFormInput } from "@/lib/schemas/team";
import { teamListFiltersSchema } from "@/lib/schemas/team-list-filters";
import {
  loadTeamListPage,
  type TeamListPageResult,
} from "@/lib/teams/load-team-list-page";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTeams(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDeactivate(): Promise<void> {
  const session = await auth();
  if (!canDeactivateTeams(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanDelete(): Promise<void> {
  const session = await auth();
  if (!canDeleteTeams(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateTeams(): void {
  revalidateTag("drizzle:teams", "default");
}

export async function loadMoreTeams(
  rawFilters: unknown,
  page: number,
): Promise<TeamListPageResult> {
  await assertCanManage();
  const filters = teamListFiltersSchema.parse(rawFilters);
  return loadTeamListPage(filters, page);
}

function todayIsoDate(): string {
  return toCalendarDateKey(new Date());
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
  await assertCanDeactivate();
  await deleteTeamRepo(documentId);
  invalidateTeams();
}

export async function permanentlyDeleteTeam(documentId: string): Promise<void> {
  await assertCanDelete();
  const team = await findTeamById(documentId);
  if (!team) throw new Error("notFound");
  if (team.active) throw new Error("activeTeam");
  await hardDeleteTeam(documentId);
  invalidateTeams();
}

export async function bulkArchiveTeams(documentIds: string[]): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkTeamIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const team = await findTeamById(documentId);
    if (!team) throw new Error("notFound");
    await deleteTeamRepo(documentId);
  }
  invalidateTeams();
}

export async function bulkDeleteTeams(documentIds: string[]): Promise<void> {
  await assertCanDelete();
  const ids = bulkTeamIdsSchema.parse(documentIds);

  for (const documentId of ids) {
    const team = await findTeamById(documentId);
    if (!team) throw new Error("notFound");
    if (team.active) throw new Error("activeTeam");
    await hardDeleteTeam(documentId);
  }
  invalidateTeams();
}
