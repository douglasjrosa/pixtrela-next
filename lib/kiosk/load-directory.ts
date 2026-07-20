import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
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
};

interface StrapiList<T> {
  data: T[];
}

export async function loadKioskDirectoryTeams(): Promise<KioskDirectoryTeam[]> {
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
  try {
    const res = await strapiFetch<StrapiList<KioskDirectoryColaborator>>(
      `/kiosk/directory/teams/${teamDocumentId}/colaborators`,
      { strapiCache: { noStore: true } },
    );
    return (res.data ?? []).map((colaborator) => ({
      ...colaborator,
      facePhotoUrl: resolveStrapiMediaUrl(colaborator.facePhotoUrl),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
