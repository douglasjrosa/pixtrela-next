import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { CurrencyBalanceProps } from "@/components/balance/currency-balance";
import type { AwardView } from "@/components/exchange/award-card";
import {
  awardPricesFromValues,
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/business/exchange";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { loadCurrencyForSubtasks } from "@/lib/strapi/currency-for-subtasks";
import { balanceTag, STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

const AWARDS_REVALIDATE_SEC = 120;

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
        pagination: { pageSize: 20 },
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

export async function loadColaboratorPrivateHome(
  userId: string,
): Promise<ColaboratorPrivateHomeData> {
  try {
    const [balanceRes, awardsRes, teamsRes, history, paymentCurrency] =
      await Promise.all([
      strapiFetch<BalanceResponse>("/balances/me/current", {
        strapiCache: { tags: [balanceTag(userId)], revalidate: 30 },
      }),
      strapiFetch<StrapiList<AwardEntity>>(
        "/awards",
        { strapiCache: { tags: [STRAPI_TAGS.awards], revalidate: AWARDS_REVALIDATE_SEC } },
        {
          fields: ["documentId", "name", "title", "description"],
          populate: {
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
