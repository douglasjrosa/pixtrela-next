import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { CurrencyBalance } from "@/components/balance/currency-balance";
import { DashboardInsightsBlock } from "@/components/dashboard/dashboard-insights-block";
import { AwardCard } from "@/components/exchange/award-card";
import { redeemAward } from "@/app/(app)/exchange/actions";
import { loadColaboratorPrivateHome } from "@/lib/colaborator/private-home-data";
import { loadColaboratorInsights } from "@/lib/dashboard/load-colaborator-insights";
import { loadMonthlyRanking } from "@/lib/dashboard/load-monthly-ranking";
import { formatDateTimePtBr } from "@/lib/format/datetime";

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

  const { balance, awards, windowOpen, spendableBalance, team, history } =
    await loadColaboratorPrivateHome(documentId);
  const ranking = await loadMonthlyRanking();
  const insights = await loadColaboratorInsights(documentId);
  const colaboratorName = session.user.name ?? "";

  return (
    <section className="space-y-10 p-6">
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold">{tBalance("title")}</h1>
        <CurrencyBalance {...balance} />
      </div>

      <DashboardInsightsBlock
        ranking={ranking}
        mode="self"
        role="colaborator"
        colaboratorOptions={[]}
        selectedDocumentId={documentId}
        selectedName={colaboratorName}
        insights={insights}
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{tExchange("title")}</h2>
        {!windowOpen && team ? (
          <p role="alert" className="text-sm text-destructive">
            {tExchange("windowClosed", {
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
              balance={spendableBalance}
              onRedeem={redeemAward}
            />
          ))}
        </div>
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
