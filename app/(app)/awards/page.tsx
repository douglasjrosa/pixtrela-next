import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  AwardManager,
  type AwardRow,
  type CurrencyOption,
} from "@/components/awards/award-manager";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { Role } from "@/lib/auth/nav";
import { canManageAwards, canViewAwards } from "@/lib/auth/permissions";
import {
  listAwards as listAwardsRepo,
  listCurrencies as listCurrenciesRepo,
} from "@/lib/repos/awards";
import { eq } from "drizzle-orm";

import { awardPrices, currencies } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";

import {
  createAward,
  deleteAward,
  updateAward,
  uploadAwardImage,
} from "./actions";

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

async function loadAwards(): Promise<AwardRow[]> {
  try {
    const rows = await listAwardsRepo();
    const db = getDb();
    const result: AwardRow[] = [];
    for (const award of rows) {
      const prices = await db
        .select({
          numberOf: awardPrices.numberOf,
          currencyId: awardPrices.currencyId,
          currencyName: currencies.name,
          currencyTitle: currencies.title,
        })
        .from(awardPrices)
        .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
        .where(eq(awardPrices.awardId, award.id));

      result.push({
        documentId: award.id,
        name: award.name,
        title: award.title,
        description: award.description,
        warnings: award.warnings,
        imageId: null,
        imageUrl: award.imageUrl,
        values: prices.map((price) => ({
          numberOf: Math.max(1, Math.floor(price.numberOf)),
          currencyDocumentId: price.currencyId,
        })),
      });
    }
    return result;
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function AwardsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewAwards(role)) {
    return <ForbiddenMessage />;
  }

  const canManage = canManageAwards(role);
  const [awards, currencies] = await Promise.all([
    loadAwards(),
    loadCurrencies(),
  ]);

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={createAward}
        onUpdate={updateAward}
        onDelete={deleteAward}
        onUploadImage={uploadAwardImage}
        canManage={canManage}
        canDelete={canManage}
      />
    </section>
  );
}
