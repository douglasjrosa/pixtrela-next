"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTeams } from "@/lib/auth/permissions";
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
  revalidateStrapiTags(STRAPI_TAGS.teams);
}

export async function createTeam(raw: TeamFormInput): Promise<void> {
  await assertCanManage();
  const data = teamFormSchema.parse(raw);
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
  await strapiFetch(`/teams/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data: toStrapiPayload(data, "update") }),
  });
  invalidateTeams();
}

export async function deleteTeam(documentId: string): Promise<void> {
  await assertCanManage();
  await strapiFetch(`/teams/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateTeams();
}
