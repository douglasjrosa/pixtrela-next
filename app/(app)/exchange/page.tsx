import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { AwardCard, type AwardView } from "@/components/exchange/award-card";
import { canExchange } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/nav";
import {
  awardPricesFromValues,
  exchangeCost,
  isExchangeWindowOpen,
} from "@/lib/business/exchange";
import { ACTIVE_TEAM_FILTER } from "@/lib/business/team-active";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { loadCurrencyForSubtasks } from "@/lib/strapi/currency-for-subtasks";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { balanceTag, STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { redeemAward } from "./actions";

const AWARDS_REVALIDATE_SEC = 120;

interface StrapiList<T> {
  data: T[];
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

interface BalanceResponse {
  data: { balance: number } | null;
}

interface ExchangeHistoryEntity {
  documentId: string;
  timestamp?: string | null;
  qty: number;
  award?: { title?: string | null; name: string } | null;
}

interface ExchangeHistoryRow {
  documentId: string;
  timestamp: string;
  awardTitle: string;
  qty: number;
}

interface ExchangeData {
  awards: AwardView[];
  windowOpen: boolean;
  balance: number;
  team: TeamEntity | null;
  history: ExchangeHistoryRow[];
}

async function loadExchangeHistory(
  userId: string | undefined,
): Promise<ExchangeHistoryRow[]> {
  if (!userId) return [];
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

async function loadExchange(userId: string | undefined): Promise<ExchangeData> {
  try {
    const awardsPromise = strapiFetch<StrapiList<AwardEntity>>(
      "/awards",
      { strapiCache: { tags: [STRAPI_TAGS.awards], revalidate: AWARDS_REVALIDATE_SEC } },
      {
        fields: ["documentId", "name", "title", "description"],
        populate: {
          image: { fields: ["url"] },
          Value: { populate: { currency: { fields: ["name"] } } },
        },
      },
    );

    const teamsPromise = userId
      ? strapiFetch<StrapiList<TeamEntity>>(
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
        )
      : Promise.resolve({ data: [] as TeamEntity[] });

    const balancePromise = userId
      ? strapiFetch<BalanceResponse>("/balances/me/current", {
          strapiCache: { tags: [balanceTag(userId)], revalidate: 30 },
        })
      : Promise.resolve({ data: null });

    const historyPromise = loadExchangeHistory(userId);
    const paymentCurrencyPromise = loadCurrencyForSubtasks();

    const [awardsRes, teamsRes, balanceRes, history, paymentCurrency] =
      await Promise.all([
        awardsPromise,
        teamsPromise,
        balancePromise,
        historyPromise,
        paymentCurrencyPromise,
      ]);

    const paymentCurrencyName = paymentCurrency.currencyName;
    const team = teamsRes.data[0] ?? null;
    const windowOpen = team ? isExchangeWindowOpen(team, new Date()) : false;
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
      awards,
      windowOpen,
      balance: balanceRes.data?.balance ?? 0,
      team,
      history,
    };
  } catch (error) {
    rethrowIfNavigationError(error);
    return { awards: [], windowOpen: false, balance: 0, team: null, history: [] };
  }
}

export default async function ExchangePage() {
  const t = await getTranslations("exchange");
  const tHistory = await getTranslations("exchangeHistory");
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canExchange(role)) {
    return <ForbiddenMessage />;
  }

  const { awards, windowOpen, balance, team, history } = await loadExchange(
    session?.user?.id,
  );

  return (
    <section className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {!windowOpen && team ? (
        <p role="alert" className="text-sm text-destructive">
          {t("windowClosed", {
            first: team.exchangesFirstDay,
            last: team.exchangesLastDay,
          })}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {awards.map((award) => (
          <AwardCard
            key={award.id}
            award={award}
            windowOpen={windowOpen}
            balance={balance}
            onRedeem={redeemAward}
          />
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{tHistory("title")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tHistory("empty")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">{tHistory("date")}</th>
                <th>{tHistory("award")}</th>
                <th>{tHistory("qty")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.documentId} className="border-b">
                  <td className="py-2">
                    {formatDateTimePtBr(entry.timestamp)}
                  </td>
                  <td>{entry.awardTitle}</td>
                  <td>{entry.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
