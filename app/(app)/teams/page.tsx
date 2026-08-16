import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { TeamsListMobileList } from "@/components/teams/teams-list-mobile-list";
import { TeamsListTableBody } from "@/components/teams/teams-list-table-body";
import { TeamsListTableFrame } from "@/components/teams/teams-list-table-frame";
import { TeamsListTableHeader } from "@/components/teams/teams-list-table-header";
import {
  TeamManager,
  type UserOption,
} from "@/components/teams/team-manager";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateTeams,
  canDeleteTeams,
  canManageTeams,
} from "@/lib/auth/permissions";
import { listUsersByRole } from "@/lib/repos/users";
import { loadTeamListPage } from "@/lib/teams/load-team-list-page";
import { parseTeamListSearchParams } from "@/lib/teams/team-list-params";

import { createTeam, deleteTeam, updateTeam } from "./actions";

interface TeamsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadUsersByRole(roleType: Role): Promise<UserOption[]> {
  if (roleType !== "leader" && roleType !== "colaborator") return [];
  try {
    const rows = await listUsersByRole(roleType);
    return rows
      .filter((user) => user.active && !user.blocked)
      .map((user) => ({
        documentId: user.id,
        name: user.name,
      }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTeams(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseTeamListSearchParams(params);
  const tTeams = await getTranslations("teams");
  const sort = { column: filters.column, direction: filters.direction };
  const canDeactivate = canDeactivateTeams(role);
  const canDelete = canDeleteTeams(role);
  const bulkEnabled = canDeactivate || canDelete;
  const showCheckboxColumn = bulkEnabled;

  const [pageResult, leaders, colaborators] = await Promise.all([
    loadTeamListPage(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return {
        teams: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    }),
    loadUsersByRole("leader"),
    loadUsersByRole("colaborator"),
  ]);

  let listContent;
  if (pageResult.teams.length === 0) {
    listContent = <ListEmptyMessage>{tTeams("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <TeamsListTableFrame
        filters={filters}
        initialTeams={pageResult.teams}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        tableHeader={
          <TeamsListTableHeader
            sort={sort}
            filters={filters}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        tableBody={
          <TeamsListTableBody
            teams={pageResult.teams}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        mobileList={
          <TeamsListMobileList
            teams={pageResult.teams}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
      />
    );
  }

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <TeamManager
        leaders={leaders}
        colaborators={colaborators}
        onCreate={createTeam}
        onUpdate={updateTeam}
        onDelete={deleteTeam}
      >
        {listContent}
      </TeamManager>
    </section>
  );
}
