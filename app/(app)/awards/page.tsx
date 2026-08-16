import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { AwardsListMobileList } from "@/components/awards/awards-list-mobile-list";
import { AwardsListTableBody } from "@/components/awards/awards-list-table-body";
import { AwardsListTableFrame } from "@/components/awards/awards-list-table-frame";
import { AwardsListTableHeader } from "@/components/awards/awards-list-table-header";
import {
  AwardManager,
  type CurrencyOption,
} from "@/components/awards/award-manager";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import type { Role } from "@/lib/auth/nav";
import {
  canDeactivateAwards,
  canDeleteAwards,
  canManageAwards,
  canViewAwards,
} from "@/lib/auth/permissions";
import { loadAwardListPage } from "@/lib/awards/load-award-list-page";
import { parseAwardListSearchParams } from "@/lib/awards/award-list-params";
import { listCurrencies as listCurrenciesRepo } from "@/lib/repos/awards";

import {
  createAward,
  deleteAward,
  updateAward,
  uploadAwardImage,
} from "./actions";

interface AwardsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadCurrencies(): Promise<CurrencyOption[]> {
  try {
    const rows = await listCurrenciesRepo();
    return rows.map((currency) => ({
      documentId: currency.id,
      name: currency.name,
      title: currency.title,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function AwardsPage({ searchParams }: AwardsPageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewAwards(role)) {
    return <ForbiddenMessage />;
  }

  const params = await searchParams;
  const filters = parseAwardListSearchParams(params);
  const tAwards = await getTranslations("awards");
  const sort = { column: filters.column, direction: filters.direction };
  const canManage = canManageAwards(role);
  const canDeactivate = canDeactivateAwards(role);
  const canDelete = canDeleteAwards(role);
  const showCheckboxColumn = canDeactivate || canDelete;

  const [pageResult, currencies] = await Promise.all([
    loadAwardListPage(filters, 1).catch((error) => {
      rethrowIfNavigationError(error);
      return {
        awards: [],
        page: 1,
        pageCount: 1,
        hasMore: false,
      };
    }),
    loadCurrencies(),
  ]);

  let listContent;
  if (pageResult.awards.length === 0) {
    listContent = <ListEmptyMessage>{tAwards("empty")}</ListEmptyMessage>;
  } else {
    listContent = (
      <AwardsListTableFrame
        filters={filters}
        currencies={currencies}
        initialAwards={pageResult.awards}
        initialPage={pageResult.page}
        initialHasMore={pageResult.hasMore}
        canDeactivate={canDeactivate}
        canDelete={canDelete}
        tableHeader={
          <AwardsListTableHeader
            sort={sort}
            filters={filters}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        tableBody={
          <AwardsListTableBody
            awards={pageResult.awards}
            currencies={currencies}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
        mobileList={
          <AwardsListMobileList
            awards={pageResult.awards}
            currencies={currencies}
            showCheckboxColumn={showCheckboxColumn}
          />
        }
      />
    );
  }

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <AwardManager
        currencies={currencies}
        onCreate={createAward}
        onUpdate={updateAward}
        onDelete={deleteAward}
        onUploadImage={uploadAwardImage}
        canManage={canManage}
        canDelete={canManage}
      >
        {listContent}
      </AwardManager>
    </section>
  );
}
