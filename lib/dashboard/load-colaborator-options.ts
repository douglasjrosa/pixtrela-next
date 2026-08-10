import type { Role } from "@/lib/auth/nav";
import { isDrizzleBackend } from "@/lib/db/backend";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listUsersByRole } from "@/lib/repos/users";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import type { ColaboratorOption } from "./types";

interface ColaboratorsResponse {
  data: ColaboratorOption[] | null;
}

async function loadDrizzleColaboratorOptions(): Promise<ColaboratorOption[]> {
  const users = await listUsersByRole("colaborator");
  return users
    .filter((user) => user.active && !user.blocked)
    .map((user) => ({
      documentId: user.id,
      name: user.name,
      code: user.code,
    }));
}

export async function loadColaboratorOptions(
  role: Role | undefined,
): Promise<ColaboratorOption[]> {
  if (!role || role === "colaborator" || role === "kiosk") {
    return [];
  }

  if (isDrizzleBackend()) {
    try {
      return await loadDrizzleColaboratorOptions();
    } catch (error) {
      rethrowIfNavigationError(error);
      return [];
    }
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
