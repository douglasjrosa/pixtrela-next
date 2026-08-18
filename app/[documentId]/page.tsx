import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { StarBalanceDetails } from "@/components/colaborator/star-balance-details";
import { StarBalanceHero } from "@/components/colaborator/star-balance-hero";
import { DashboardInsightsBlock } from "@/components/dashboard/dashboard-insights-block";
import { buttonVariants } from "@/components/ui/button";
import { loadColaboratorPrivateHome } from "@/lib/colaborator/private-home-data";
import { loadColaboratorInsights } from "@/lib/dashboard/load-colaborator-insights";
import { loadMonthlyRanking } from "@/lib/dashboard/load-monthly-ranking";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { buildStorePath } from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function ColaboratorPrivatePage({ params }: PageProps) {
  const tBalance = await getTranslations("balance");
  const tExchange = await getTranslations("exchange");
  const tHistory = await getTranslations("exchangeHistory");
  const session = await auth();
  const { documentId } = await params;

  if (session?.user?.role !== "colaborator") {
    redirect("/");
  }

  if (session.user.id !== documentId) {
    redirect(`/${session.user.id}`);
  }

  const { balance, windowOpen, history } =
    await loadColaboratorPrivateHome(documentId);
  const ranking = await loadMonthlyRanking();
  const insights = await loadColaboratorInsights(documentId);
  const colaboratorName = session.user.name ?? "";

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="sr-only">{tBalance("title")}</h1>
        <StarBalanceHero
          balance={balance.balance}
          currencyLabel={balance.currencyLabel}
        />
        <StarBalanceDetails
          balance={balance.balance}
          previousBalance={balance.previousBalance}
          totalIncome={balance.totalIncome}
          totalOutcome={balance.totalOutcome}
        />
      </div>

      <Link
        href={buildStorePath(documentId)}
        className={cn(
          buttonVariants({ variant: "default", size: "lg" }),
          "min-h-12 w-full rounded-2xl px-4 text-base font-bold active:scale-[0.98]",
          windowOpen
            ? "bg-star-gold text-star-gold-foreground hover:bg-star-gold/90"
            : "",
        )}
      >
        {windowOpen ? tExchange("goToStore") : tExchange("scrollToStore")}
      </Link>

      <DashboardInsightsBlock
        ranking={ranking}
        mode="self"
        role="colaborator"
        colaboratorOptions={[]}
        selectedDocumentId={documentId}
        selectedName={colaboratorName}
        insights={insights}
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{tHistory("title")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tHistory("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.documentId}
                className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{entry.awardTitle}</p>
                  <p className="text-muted-foreground">
                    {formatDateTimePtBr(entry.timestamp)}
                  </p>
                </div>
                <span className="tabular-nums">×{entry.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
