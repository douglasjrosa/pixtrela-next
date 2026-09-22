import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";

import { currencies, currencyForSubtasks } from "@/drizzle/schema";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { getDb, type Db } from "@/lib/db/client";

export type ResolvedPaymentCurrency = {
  id: string;
  name: string;
  title: string | null;
  pluralTitle: string | null;
  currencyPerSecond: number;
  currencyPluralTitle: string;
};

export async function getOpenPaymentCurrencySetting(db: Db = getDb()) {
  const [row] = await db
    .select()
    .from(currencyForSubtasks)
    .where(isNull(currencyForSubtasks.validUntil))
    .orderBy(desc(currencyForSubtasks.validFrom))
    .limit(1);
  return row ?? null;
}

export async function resolvePaymentCurrencyAt(
  at: Date,
  db: Db = getDb(),
): Promise<ResolvedPaymentCurrency | null> {
  const [row] = await db
    .select({
      id: currencies.id,
      name: currencies.name,
      title: currencies.title,
      pluralTitle: currencies.pluralTitle,
      currencyPerSecond: currencies.currencyPerSecond,
    })
    .from(currencyForSubtasks)
    .innerJoin(currencies, eq(currencyForSubtasks.currencyId, currencies.id))
    .where(
      and(
        lte(currencyForSubtasks.validFrom, at),
        or(
          isNull(currencyForSubtasks.validUntil),
          gt(currencyForSubtasks.validUntil, at),
        ),
      ),
    )
    .orderBy(desc(currencyForSubtasks.validFrom))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    pluralTitle: row.pluralTitle,
    currencyPerSecond: Number(row.currencyPerSecond),
    currencyPluralTitle: resolveCurrencyPluralTitle(row),
  };
}
