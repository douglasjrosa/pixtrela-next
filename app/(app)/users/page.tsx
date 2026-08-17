import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { UserManager } from "@/components/users/user-manager";
import { UsersListMobileList } from "@/components/users/users-list-mobile-list";
import { UsersListTableBody } from "@/components/users/users-list-table-body";
import { UsersListTableFrame } from "@/components/users/users-list-table-frame";
import { UsersListTableHeader } from "@/components/users/users-list-table-header";
import type { Role } from "@/lib/auth/nav";
import {
  canEditUserLogin,
  canPairUserTag,
  canPreviewKioskColaborator,
  canSetUserPassword,
  canViewUsers,
} from "@/lib/auth/permissions";
import { canDeleteUsers, manageableTargetRoles } from "@/lib/business/roles";
import { listUserUniquenessOwners } from "@/lib/repos/users";
import { loadUserListPage } from "@/lib/users/load-user-list-page";
import { parseUserListSearchParams } from "@/lib/users/user-list-params";

import {
  createUser,
  deactivateUser,
  deleteUser,
  pairUserTag,
  updateUser,
  updateUserImage,
} from "./actions";

interface UsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewUsers(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseUserListSearchParams(params);
  const tUsers = await getTranslations("users");
  const sort = { column: filters.column, direction: filters.direction };
  const actorRole = role!;

  const [pageResult, existingUsers] = await Promise.all([
    loadUserListPage(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return {
        users: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    }),
    listUserUniquenessOwners().catch((error) => {
      rethrowIfNavigationError(error);
      return [];
    }),
  ]);

  let listContent;
  if (pageResult.users.length === 0) {
    listContent = <ListEmptyMessage>{tUsers("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <UsersListTableFrame
        filters={filters}
        initialUsers={pageResult.users}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        tableHeader={
          <UsersListTableHeader sort={sort} filters={filters} />
        }
        tableBody={<UsersListTableBody users={pageResult.users} />}
        mobileList={<UsersListMobileList users={pageResult.users} />}
      />
    );
  }

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <UserManager
        existingUsers={existingUsers}
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
      >
        {listContent}
      </UserManager>
    </section>
  );
}
