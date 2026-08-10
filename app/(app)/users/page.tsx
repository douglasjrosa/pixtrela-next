import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { UserManager, type UserRow } from "@/components/users/user-manager";
import type { Role } from "@/lib/auth/nav";
import {
  canEditUserLogin,
  canPairUserTag,
  canPreviewKioskColaborator,
  canSetUserPassword,
  canViewUsers,
} from "@/lib/auth/permissions";
import { canDeleteUsers, manageableTargetRoles } from "@/lib/business/roles";
import { isDrizzleBackend } from "@/lib/db/backend";
import { listUsers as listUsersRepo } from "@/lib/repos/users";
import type { UserFormInput } from "@/lib/schemas/user";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

import {
  createUser,
  deactivateUser,
  deleteUser,
  pairUserTag,
  updateUser,
  updateUserImage,
} from "./actions";

interface MediaEntity {
  url?: string | null;
}

interface UserEntity {
  documentId?: string;
  id: number;
  name?: string;
  username: string;
  email?: string | null;
  code?: number;
  roleType?: UserFormInput["roleType"];
  greetingGender?: "masculine" | "feminine" | null;
  blocked?: boolean;
  avatar?: MediaEntity | null;
  facePhoto?: MediaEntity | null;
}

async function loadUsers(): Promise<UserRow[]> {
  if (isDrizzleBackend()) {
    const rows = await listUsersRepo();
    return rows.map((user) => ({
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
      avatarUrl: null,
      facePhotoUrl: null,
    }));
  }

  try {
    const res = await strapiFetch<UserEntity[]>(
      "/users",
      { strapiCache: { tags: [STRAPI_TAGS.users], revalidate: 60 } },
      {
        fields: [
          "documentId",
          "id",
          "name",
          "username",
          "email",
          "code",
          "roleType",
          "greetingGender",
          "blocked",
        ],
        populate: {
          avatar: { fields: ["url"] },
          facePhoto: { fields: ["url"] },
        },
      },
    );
    return res.map((user) => ({
      id: user.id,
      documentId: user.documentId ?? String(user.id),
      name: user.name ?? user.username,
      username: user.username,
      email: user.email ?? null,
      code: user.code ?? 0,
      roleType: user.roleType ?? "colaborator",
      greetingGender: user.greetingGender ?? null,
      blocked: Boolean(user.blocked),
      avatarUrl: resolveStrapiMediaUrl(user.avatar?.url ?? null),
      facePhotoUrl: resolveStrapiMediaUrl(user.facePhoto?.url ?? null),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function UsersPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewUsers(role)) {
    return <ForbiddenMessage />;
  }

  const users = await loadUsers();
  const actorRole = role!;

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <UserManager
        users={users}
        onCreate={createUser}
        onUpdate={updateUser}
        onUpdateImage={updateUserImage}
        onDelete={deleteUser}
        onDeactivate={deactivateUser}
        canDelete={canDeleteUsers(actorRole)}
        canDeactivate
        manageableRoles={manageableTargetRoles(actorRole)}
        canPairUserTag={canPairUserTag(actorRole)}
        canPreviewKioskColaborator={canPreviewKioskColaborator(actorRole)}
        canSetPassword={canSetUserPassword(actorRole)}
        canEditUserLogin={canEditUserLogin(actorRole)}
        canManageImages={actorRole === "admin"}
        onPairUserTag={pairUserTag}
      />
    </section>
  );
}
