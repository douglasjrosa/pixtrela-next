import type { UserRow } from "@/components/users/types";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import type { UserRecord } from "@/lib/repos/users";

export function mapUserRecordToRow(user: UserRecord): UserRow {
  return {
    id: user.id,
    documentId: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    code: user.code,
    roleType: user.role,
    greetingGender:
      user.greetingGender === "neutral" ? null : user.greetingGender,
    blocked: user.blocked || !user.active,
    avatarUrl: toBrowserMediaUrl(user.avatarUrl),
    facePhotoUrl: toBrowserMediaUrl(user.facePhotoUrl),
  };
}
