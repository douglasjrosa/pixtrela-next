import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { UserManager, type UserRow } from "@/components/users/user-manager";
import type { Role } from "@/lib/auth/nav";
import {
  canEditUserLogin,
  canPreviewKioskColaborator,
  canSetUserPassword,
  canViewUsers,
  canWriteKioskNfc,
} from "@/lib/auth/permissions";
import { canDeleteUsers, manageableTargetRoles } from "@/lib/business/roles";
import type { UserFormInput } from "@/lib/schemas/user";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { createUser, deleteUser, updateUser } from "./actions";

interface UserEntity {
  documentId?: string;
  id: number;
  name?: string;
  username: string;
  code?: number;
  roleType?: UserFormInput["roleType"];
}

async function loadUsers(): Promise<UserRow[]> {
  try {
    const res = await strapiFetch<UserEntity[]>(
      "/users",
      { strapiCache: { tags: [STRAPI_TAGS.users], revalidate: 60 } },
      {
        fields: ["documentId", "id", "name", "username", "code", "roleType"],
      },
    );
    return res.map((user) => ({
      id: user.id,
      documentId: user.documentId ?? String(user.id),
      name: user.name ?? user.username,
      username: user.username,
      code: user.code ?? 0,
      roleType: user.roleType ?? "colaborator",
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
    <section className="p-6">
      <UserManager
        users={users}
        onCreate={createUser}
        onUpdate={updateUser}
        onDelete={deleteUser}
        canDelete={canDeleteUsers(actorRole)}
        manageableRoles={manageableTargetRoles(actorRole)}
        canWriteKioskNfc={canWriteKioskNfc(actorRole)}
        canPreviewKioskColaborator={canPreviewKioskColaborator(actorRole)}
        canSetPassword={canSetUserPassword(actorRole)}
        canEditUserLogin={canEditUserLogin(actorRole)}
      />
    </section>
  );
}
