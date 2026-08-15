import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { findUserAvatarUrl, findUserById } from "@/lib/repos/users";

export type KioskColaboratorProfile = {
  documentId: string;
  name: string;
  avatarUrl: string | null;
};

export async function loadKioskColaboratorProfile(
  colaboratorId: string,
): Promise<KioskColaboratorProfile | null> {
  try {
    const user = await findUserById(colaboratorId);
    if (!user || user.role !== "colaborator" || !user.active || user.blocked) {
      return null;
    }
    const avatarUrl = await findUserAvatarUrl(colaboratorId);
    return {
      documentId: user.id,
      name: user.name,
      avatarUrl: avatarUrl ? toBrowserMediaUrl(avatarUrl) : null,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}
