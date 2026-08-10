"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTeams } from "@/lib/auth/permissions";
import { isDrizzleBackend } from "@/lib/db/backend";
import {
  createTeam as createTeamRepo,
  deleteTeam as deleteTeamRepo,
  updateTeam as updateTeamRepo,
} from "@/lib/repos/teams";
import { teamFormSchema, type TeamFormInput } from "@/lib/schemas/team";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageTeams(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function toStrapiPayload(input: TeamFormInput, mode: "create" | "update") {
  const payload: Record<string, unknown> = {
    name: input.name,
    exchangesFirstDay: input.exchangesFirstDay,
    exchangesLastDay: input.exchangesLastDay,
  };

  if (input.leaderDocumentId) {
    payload.leader = input.leaderDocumentId;
  }
  if (input.colaboratorDocumentIds?.length) {
    payload.colaborators = input.colaboratorDocumentIds;
  }

  if (mode === "create") {
    payload.since = new Date().toISOString().slice(0, 10);
    return payload;
  }

  payload.untill = input.untill?.trim() ? input.untill.trim() : null;
  return payload;
}

function invalidateTeams(): void {
  if (isDrizzleBackend()) {
    revalidateTag("drizzle:teams", "default");
    return;
  }
  revalidateStrapiTags(STRAPI_TAGS.teams);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createTeam(raw: TeamFormInput): Promise<void> {
  await assertCanManage();
  const data = teamFormSchema.parse(raw);

  if (isDrizzleBackend()) {
    await createTeamRepo({
      name: data.name,
      leaderId: data.leaderDocumentId || null,
      exchangesFirstDay: data.exchangesFirstDay,
      exchangesLastDay: data.exchangesLastDay,
      memberIds: data.colaboratorDocumentIds ?? [],
      since: todayIsoDate(),
    });
    invalidateTeams();
    return;
  }

  await strapiFetch("/teams", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data, "create") }),
  });
  invalidateTeams();
}

export async function updateTeam(
  documentId: string,
  raw: TeamFormInput,
): Promise<void> {
  await assertCanManage();
  const data = teamFormSchema.parse(raw);

  if (isDrizzleBackend()) {
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
    return;
  }

  await strapiFetch(`/teams/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data, "update") }),
  });
  invalidateTeams();
}

export async function deleteTeam(documentId: string): Promise<void> {
  await assertCanManage();

  if (isDrizzleBackend()) {
    await deleteTeamRepo(documentId);
    invalidateTeams();
    return;
  }

  await strapiFetch(`/teams/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTeams();
}
