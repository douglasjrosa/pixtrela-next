import { and, eq, inArray } from "drizzle-orm";

import { mediaAssets, teamMembers, teams, users } from "@/drizzle/schema";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listActiveTeams } from "@/lib/repos/teams";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { strapiFetch } from "@/lib/strapi";

export type KioskDirectoryTeam = {
  documentId: string;
  name: string;
};

export type KioskDirectoryColaborator = {
  documentId: string;
  name: string;
  facePhotoUrl: string | null;
  avatarUrl: string | null;
  greetingGender: "masculine" | "feminine" | null;
};

interface StrapiList<T> {
  data: T[];
}

function mapGreetingGender(
  value: string | null | undefined,
): "masculine" | "feminine" | null {
  if (value === "masculine" || value === "male") return "masculine";
  if (value === "feminine" || value === "female") return "feminine";
  return null;
}

export async function loadKioskDirectoryTeams(): Promise<KioskDirectoryTeam[]> {
  if (isDrizzleBackend()) {
    try {
      const rows = await listActiveTeams();
      return rows.map((team) => ({
        documentId: team.id,
        name: team.name,
      }));
    } catch (error) {
      rethrowIfNavigationError(error);
      return [];
    }
  }

  try {
    const res = await strapiFetch<StrapiList<KioskDirectoryTeam>>(
      "/kiosk/directory/teams",
      { strapiCache: { noStore: true } },
    );
    return res.data ?? [];
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export async function loadKioskDirectoryTeamColaborators(
  teamDocumentId: string,
): Promise<KioskDirectoryColaborator[]> {
  if (isDrizzleBackend()) {
    try {
      const db = getDb();
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          greetingGender: users.greetingGender,
          avatarMediaId: users.avatarMediaId,
          facePhotoMediaId: users.facePhotoMediaId,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(
          and(
            eq(teamMembers.teamId, teamDocumentId),
            eq(teams.active, true),
            eq(users.role, "colaborator"),
            eq(users.active, true),
            eq(users.blocked, false),
          ),
        );

      const mediaIds = [
        ...rows.map((row) => row.avatarMediaId),
        ...rows.map((row) => row.facePhotoMediaId),
      ].filter((id): id is string => Boolean(id));

      const mediaRows =
        mediaIds.length === 0
          ? []
          : await db
              .select({ id: mediaAssets.id, url: mediaAssets.url })
              .from(mediaAssets)
              .where(inArray(mediaAssets.id, mediaIds));
      const urlById = new Map(mediaRows.map((row) => [row.id, row.url]));

      return rows.map((row) => ({
        documentId: row.id,
        name: row.name,
        avatarUrl: row.avatarMediaId
          ? (urlById.get(row.avatarMediaId) ?? null)
          : null,
        facePhotoUrl: row.facePhotoMediaId
          ? (urlById.get(row.facePhotoMediaId) ?? null)
          : null,
        greetingGender: mapGreetingGender(row.greetingGender),
      }));
    } catch (error) {
      rethrowIfNavigationError(error);
      return [];
    }
  }

  try {
    const res = await strapiFetch<StrapiList<KioskDirectoryColaborator>>(
      `/kiosk/directory/teams/${teamDocumentId}/colaborators`,
      { strapiCache: { noStore: true } },
    );
    return (res.data ?? []).map((colaborator) => ({
      ...colaborator,
      facePhotoUrl: resolveStrapiMediaUrl(colaborator.facePhotoUrl),
      avatarUrl: resolveStrapiMediaUrl(colaborator.avatarUrl ?? null),
      greetingGender: colaborator.greetingGender ?? null,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
