import { eq } from "drizzle-orm";

import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  awardPricesFromValues,
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/business/exchange";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import type { CurrencyBalanceProps } from "@/lib/colaborator/balance-view";
import type { AwardView } from "@/components/exchange/award-card";
import { isDrizzleBackend } from "@/lib/db/backend";
import { getDb } from "@/lib/db/client";
import { getOrCreateMonthlyBalance } from "@/lib/repos/balances";
import { listAwards } from "@/lib/repos/awards";
import { listRecentExchangesForUser } from "@/lib/repos/exchanges";
import { getCurrencyForSubtasks } from "@/lib/repos/settings";
import { findActiveTeamWindowForUser } from "@/lib/repos/teams";
import { awardPrices, currencies } from "@/drizzle/schema";
import { loadCurrencyForSubtasks } from "@/lib/strapi/currency-for-subtasks";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { balanceTag, STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

const AWARDS_REVALIDATE_SEC = 120;
const HISTORY_LIMIT = 20;

interface StrapiList<T> {
  data: T[];
}

interface BalanceResponse {
  data: Partial<CurrencyBalanceProps> | null;
}

interface AwardEntity {
  documentId: string;
  title?: string;
  name: string;
  description?: string;
  image?: { url?: string } | null;
  Value?: { numberOf?: number; currency?: { name?: string } }[];
}

interface TeamEntity {
  exchangesFirstDay: number;
  exchangesLastDay: number;
}

interface ExchangeHistoryEntity {
  documentId: string;
  timestamp?: string | null;
  qty: number;
  award?: { title?: string | null; name: string } | null;
}

export interface ExchangeHistoryRow {
  documentId: string;
  timestamp: string;
  awardTitle: string;
  qty: number;
}

export interface ColaboratorPrivateHomeData {
  balance: CurrencyBalanceProps;
  awards: AwardView[];
  windowOpen: boolean;
  spendableBalance: number;
  team: TeamEntity | null;
  history: ExchangeHistoryRow[];
}

const EMPTY_BALANCE: CurrencyBalanceProps = {
  balance: 0,
  previousBalance: 0,
  totalIncome: 0,
  totalOutcome: 0,
};

async function loadExchangeHistory(
  userId: string,
): Promise<ExchangeHistoryRow[]> {
  try {
    const res = await strapiFetch<StrapiList<ExchangeHistoryEntity>>(
      "/exchanges",
      {
        strapiCache: {
          tags: [STRAPI_TAGS.exchanges, `${STRAPI_TAGS.exchanges}:${userId}`],
          revalidate: 30,
        },
      },
      {
        fields: ["documentId", "timestamp", "qty"],
        filters: { user: { documentId: { $eq: userId } } },
        populate: { award: { fields: ["name", "title"] } },
        sort: "timestamp:desc",
        pagination: { pageSize: HISTORY_LIMIT },
      },
    );
    return res.data.map((entry) => ({
      documentId: entry.documentId,
      timestamp: entry.timestamp ?? "",
      awardTitle: entry.award?.title ?? entry.award?.name ?? "—",
      qty: entry.qty,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadDrizzlePrivateHome(
  userId: string,
): Promise<ColaboratorPrivateHomeData> {
  const payment = await getCurrencyForSubtasks();
  const team = await findActiveTeamWindowForUser(userId);
  const windowOpen = team ? isExchangeWindowOpen(team, new Date()) : false;

  let balance: CurrencyBalanceProps = { ...EMPTY_BALANCE };
  if (payment) {
    const monthly = await getOrCreateMonthlyBalance({
      userId,
      currencyId: payment.currencyId,
    });
    balance = {
      balance: monthly.balance,
      previousBalance: monthly.previousBalance,
      totalIncome: monthly.totalIncome,
      totalOutcome: monthly.totalOutcome,
      currencyLabel:
        payment.currencyPluralTitle || payment.currencyTitle || undefined,
    };
  }

  const awardRows = await listAwards();
  const db = getDb();
  const paymentCurrencyName = payment?.currencyName ?? "";
  const awards: AwardView[] = [];

  for (const award of awardRows) {
    if (!award.active) continue;
    const prices = await db
      .select({
        numberOf: awardPrices.numberOf,
        currencyName: currencies.name,
      })
      .from(awardPrices)
      .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
      .where(eq(awardPrices.awardId, award.id));

    const priceTable = awardPricesFromValues(
      prices.map((price) => ({
        numberOf: price.numberOf,
        currency: { name: price.currencyName },
      })),
    );

    awards.push({
      id: award.id,
      title: award.title ?? award.name,
      description: award.description ?? undefined,
      currency: paymentCurrencyName,
      cost: paymentCurrencyName
        ? exchangeCost(priceTable, paymentCurrencyName, 1)
        : 0,
      imageUrl: award.imageUrl,
    });
  }

  const historyRows = await listRecentExchangesForUser(userId, HISTORY_LIMIT);
  const history = historyRows.map((entry) => ({
    documentId: entry.id,
    timestamp: entry.timestamp.toISOString(),
    awardTitle: entry.awardTitle || "—",
    qty: entry.qty,
  }));

  return {
    balance,
    awards,
    windowOpen,
    spendableBalance: balance.balance,
    team,
    history,
  };
}

export async function loadColaboratorPrivateHome(
  userId: string,
): Promise<ColaboratorPrivateHomeData> {
  if (isDrizzleBackend()) {
    try {
      return await loadDrizzlePrivateHome(userId);
    } catch (error) {
      rethrowIfNavigationError(error);
      return {
        balance: EMPTY_BALANCE,
        awards: [],
        windowOpen: false,
        spendableBalance: 0,
        team: null,
        history: [],
      };
    }
  }

  try {
    const [balanceRes, awardsRes, teamsRes, history, paymentCurrency] =
      await Promise.all([
      strapiFetch<BalanceResponse>("/balances/me/current", {
        strapiCache: { tags: [balanceTag(userId)], revalidate: 30 },
      }),
      strapiFetch<StrapiList<AwardEntity>>(
        "/awards",
        {
          strapiCache: {
            tags: [STRAPI_TAGS.awards],
            revalidate: AWARDS_REVALIDATE_SEC,
          },
        },
        {
          fields: ["documentId", "name", "title", "description"],
          populate: {
            image: { fields: ["url"] },
            Value: { populate: { currency: { fields: ["name"] } } },
          },
        },
      ),
      strapiFetch<StrapiList<TeamEntity>>(
        "/teams",
        {
          strapiCache: {
            tags: [STRAPI_TAGS.teams, `${STRAPI_TAGS.teams}:${userId}`],
            revalidate: 60,
          },
        },
        {
          fields: ["exchangesFirstDay", "exchangesLastDay"],
          filters: {
            ...ACTIVE_TEAM_FILTER,
            colaborators: { documentId: { $eq: userId } },
          },
          pagination: { pageSize: 1 },
        },
      ),
      loadExchangeHistory(userId),
      loadCurrencyForSubtasks(),
    ]);

    const paymentCurrencyName = paymentCurrency.currencyName;
    const team = teamsRes.data[0] ?? null;
    const windowOpen = team ? isExchangeWindowOpen(team, new Date()) : false;
    const balance = {
      ...EMPTY_BALANCE,
      ...(balanceRes.data ?? {}),
      currencyLabel:
        paymentCurrency.currencyPluralTitle ||
        paymentCurrency.currencyTitle ||
        undefined,
    };
    const awards = awardsRes.data.map((award) => {
      const prices = awardPricesFromValues(award.Value);
      return {
        id: award.documentId,
        title: award.title ?? award.name,
        description: award.description,
        currency: paymentCurrencyName,
        cost: paymentCurrencyName
          ? exchangeCost(prices, paymentCurrencyName, 1)
          : 0,
        imageUrl: resolveStrapiMediaUrl(award.image?.url),
      };
    });

    return {
      balance,
      awards,
      windowOpen,
      spendableBalance: balance.balance,
      team,
      history,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return {
      balance: EMPTY_BALANCE,
      awards: [],
      windowOpen: false,
      spendableBalance: 0,
      team: null,
      history: [],
    };
  }
}
