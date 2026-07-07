import type { Role } from "@/lib/auth/nav";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import type { ColaboratorOption } from "./types";

interface ColaboratorsResponse {
  data: ColaboratorOption[] | null;
}

export async function loadColaboratorOptions(
  role: Role | undefined,
): Promise<ColaboratorOption[]> {
  if (!role || role === "colaborator" || role === "kiosk") {
    return [];
  }

  try {
    const response = await strapiFetch<ColaboratorsResponse>(
      "/dashboard/colaborators",
      {
        strapiCache: {
          tags: [STRAPI_TAGS.users],
          revalidate: 60,
        },
      },
    );
    return response.data ?? [];
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
