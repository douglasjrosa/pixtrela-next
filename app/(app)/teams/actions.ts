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
  archiveTeams,
  createTeam as createTeamRepo,
  deleteTeam as deleteTeamRepo,
  findTeamById,
  hardDeleteTeam,
  updateTeam as updateTeamRepo,
} from "@/lib/repos/teams";
import { toCalendarDateKey } from "@/lib/business/datetime-timezone";
import { auditSuccess } from "@/lib/logs/record-log";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
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
  await auditSuccess({
    route: "/teams",
    verb: "created",
    entity: "team",
    name: data.name,
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
  await auditSuccess({
    route: "/teams",
    verb: "updated",
    entity: "team",
    name: data.name,
  });
  invalidateTeams();
}

export async function deleteTeam(
  documentId: string,
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const text = parseArchiveReason(reason, 1);
  const team = await findTeamById(documentId);
  await deleteTeamRepo(documentId, text);
  await auditSuccess({
    route: "/teams",
    verb: "archived",
    entity: "team",
    name: team?.name,
  });
  invalidateTeams();
}

export async function permanentlyDeleteTeam(documentId: string): Promise<void> {
  await assertCanDelete();
  const team = await findTeamById(documentId);
  if (!team) throw new Error("notFound");
  if (team.active) throw new Error("activeTeam");
  await hardDeleteTeam(documentId);
  await auditSuccess({
    route: "/teams",
    verb: "deleted",
    entity: "team",
    name: team.name,
  });
  invalidateTeams();
}

export async function bulkArchiveTeams(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanDeactivate();
  const ids = bulkTeamIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);

  for (const documentId of ids) {
    const team = await findTeamById(documentId);
    if (!team) throw new Error("notFound");
  }
  await archiveTeams(ids, text);
  await auditSuccess({
    route: "/teams",
    verb: "bulkArchived",
    entity: "teams",
    quantity: ids.length,
  });
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
  await auditSuccess({
    route: "/teams",
    verb: "bulkDeleted",
    entity: "teams",
    quantity: ids.length,
  });
  invalidateTeams();
}
