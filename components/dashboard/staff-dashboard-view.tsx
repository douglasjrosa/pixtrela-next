import { getTranslations } from "next-intl/server";

import { DashboardInsightsBlock } from "@/components/dashboard/dashboard-insights-block";
import type { Role } from "@/lib/auth/nav";
import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
import type { BalanceAdjustmentResult } from "@/lib/dashboard/apply-balance-adjustment";
import { loadColaboratorInsights } from "@/lib/dashboard/load-colaborator-insights";
import { loadMonthlyRanking } from "@/lib/dashboard/load-monthly-ranking";
import { resolveDefaultColaboratorDocumentId } from "@/lib/dashboard/resolve-default-colaborator";
import type {
  ColaboratorInsightsData,
  ColaboratorOption,
} from "@/lib/dashboard/types";
import { resolveCurrencyPluralTitle } from "@/lib/domain/currency-display";
import { listCurrencies } from "@/lib/repos/awards";
import type { BalanceAdjustmentInput } from "@/lib/schemas/balance-adjustment";
import { loadCurrencyForSubtasks } from "@/lib/settings/load-currency-for-subtasks";

const STAFF_ROLES: Role[] = ["admin", "manager", "leader"];

function isStaffRole(role: Role | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role);
}

const EMPTY_INSIGHTS: ColaboratorInsightsData = {
  colaboratorDocumentId: "",
  month: "",
  dailyIncomeByCurrency: [],
  previousMonthsByCurrency: [],
};

export interface StaffDashboardViewProps {
  role: Role | undefined;
  sessionUserId: string | undefined;
  colaboratorParam: string | undefined;
  colaboratorOptions: ColaboratorOption[];
  onAdjustBalance: (
    input: BalanceAdjustmentInput,
  ) => Promise<BalanceAdjustmentResult>;
}

export async function StaffDashboardView({
  role,
  sessionUserId,
  colaboratorParam,
  colaboratorOptions,
  onAdjustBalance,
}: StaffDashboardViewProps) {
  const t = await getTranslations("app");
  const ranking = await loadMonthlyRanking();

  const selectedDocumentId = isStaffRole(role)
    ? resolveDefaultColaboratorDocumentId({
        role,
        sessionUserId,
        searchParam: colaboratorParam,
        options: colaboratorOptions,
      })
    : null;

  const selectedName =
    colaboratorOptions.find(
      (option) => option.documentId === selectedDocumentId,
    )?.name ?? "";

  const insights = selectedDocumentId
    ? await loadColaboratorInsights(selectedDocumentId)
    : EMPTY_INSIGHTS;

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
        onAdjustBalance={onAdjustBalance}
      />
    </section>
  );
}
