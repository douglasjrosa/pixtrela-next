import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { adjustColaboratorBalance } from "@/app/(app)/balance-adjustment-actions";
import { DashboardInsightsBlock } from "@/components/dashboard/dashboard-insights-block";
import type { Role } from "@/lib/auth/nav";
import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { loadColaboratorInsights } from "@/lib/dashboard/load-colaborator-insights";
import { loadColaboratorOptions } from "@/lib/dashboard/load-colaborator-options";
import { loadMonthlyRanking } from "@/lib/dashboard/load-monthly-ranking";
import { resolveDefaultColaboratorDocumentId } from "@/lib/dashboard/resolve-default-colaborator";
import { listCurrencies } from "@/lib/repos/awards";
import { loadCurrencyForSubtasks } from "@/lib/settings/load-currency-for-subtasks";

interface DashboardPageProps {
  searchParams: Promise<{ colaborator?: string }>;
}

function isStaffRole(role: Role | undefined): boolean {
  return role === "admin" || role === "manager" || role === "leader";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const t = await getTranslations("app");
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const params = await searchParams;

  const ranking = await loadMonthlyRanking();
  const colaboratorOptions = isStaffRole(role)
    ? await loadColaboratorOptions(role)
    : [];

  const selectedDocumentId = isStaffRole(role)
    ? resolveDefaultColaboratorDocumentId({
        role,
        sessionUserId: session?.user?.id,
        searchParam: params.colaborator,
        options: colaboratorOptions,
      })
    : null;

  const selectedName =
    colaboratorOptions.find((option) => option.documentId === selectedDocumentId)
      ?.name ?? "";

  const insights = selectedDocumentId
    ? await loadColaboratorInsights(selectedDocumentId)
    : {
        colaboratorDocumentId: "",
        month: "",
        dailyIncomeByCurrency: [],
        previousMonthsByCurrency: [],
      };

  const canAdjustBalance = canAdjustColaboratorBalance(role);
  const [currencies, subtaskCurrency] = canAdjustBalance
    ? await Promise.all([listCurrencies(), loadCurrencyForSubtasks()])
    : [[], null];

  const balanceCurrencyOptions = canAdjustBalance
    ? currencies.map((currency) => ({
        id: currency.id,
        label: resolveCurrencyPluralTitle(currency),
      }))
    : [];

  const defaultBalanceCurrencyId = subtaskCurrency?.currencyDocumentId ?? null;

  return (
    <section className="space-y-10 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("name")}</h1>
        <p className="text-muted-foreground">{t("slogan")}</p>
      </div>

      <DashboardInsightsBlock
        showRanking
        ranking={ranking}
        mode="staff"
        role={role ?? "colaborator"}
        colaboratorOptions={colaboratorOptions}
        selectedDocumentId={selectedDocumentId ?? ""}
        selectedName={selectedName}
        insights={insights}
        balanceCurrencyOptions={balanceCurrencyOptions}
        defaultBalanceCurrencyId={defaultBalanceCurrencyId}
        onAdjustBalance={adjustColaboratorBalance}
      />
    </section>
  );
}
