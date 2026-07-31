import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

export type KioskColaboratorProfile = {
  documentId: string;
  name: string;
  avatarUrl: string | null;
};

interface StrapiSingle<T> {
  data: T | null;
}

interface ProfileEntity {
  documentId: string;
  name: string;
  avatarUrl?: string | null;
}

export async function loadKioskColaboratorProfile(
  colaboratorId: string,
): Promise<KioskColaboratorProfile | null> {
  try {
    const res = await strapiFetch<StrapiSingle<ProfileEntity>>(
      `/kiosk/colaborators/${colaboratorId}`,
      {
        strapiCache: {
          tags: [STRAPI_TAGS.users],
          revalidate: 60,
        },
      },
    );
    const profile = res.data;
    if (!profile?.documentId || !profile.name) return null;
    return {
      documentId: profile.documentId,
      name: profile.name,
      avatarUrl: resolveStrapiMediaUrl(profile.avatarUrl ?? null),
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
