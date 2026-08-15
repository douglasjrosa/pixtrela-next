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
import { listUsers as listUsersRepo } from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

import {
  createUser,
  deactivateUser,
  deleteUser,
  pairUserTag,
  updateUser,
  updateUserImage,
} from "./actions";

async function loadUsers(): Promise<UserRow[]> {
  try {
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
      avatarUrl: toBrowserMediaUrl(user.avatarUrl),
      facePhotoUrl: toBrowserMediaUrl(user.facePhotoUrl),
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
