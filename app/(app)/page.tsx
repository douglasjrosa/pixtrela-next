import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { DashboardInsightsBlock } from "@/components/dashboard/dashboard-insights-block";
import type { Role } from "@/lib/auth/nav";
import { loadColaboratorInsights } from "@/lib/dashboard/load-colaborator-insights";
import { loadColaboratorOptions } from "@/lib/dashboard/load-colaborator-options";
import { loadMonthlyRanking } from "@/lib/dashboard/load-monthly-ranking";
import { resolveDefaultColaboratorDocumentId } from "@/lib/dashboard/resolve-default-colaborator";

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
      />
    </section>
  );
}
