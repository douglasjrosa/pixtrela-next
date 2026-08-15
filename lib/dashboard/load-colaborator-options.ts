import type { Role } from "@/lib/auth/nav";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { listUsersByRole } from "@/lib/repos/users";

import type { ColaboratorOption } from "./types";

export async function loadColaboratorOptions(
  role: Role | undefined,
): Promise<ColaboratorOption[]> {
  if (!role || role === "colaborator" || role === "kiosk") {
    return [];
  }

  try {
    const users = await listUsersByRole("colaborator");
    return users
      .filter((user) => user.active && !user.blocked)
      .map((user) => ({
        documentId: user.id,
        name: user.name,
        code: user.code,
      }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}
