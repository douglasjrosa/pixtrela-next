import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  APP_LIST_PAGE_HEADER_ROW_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "@/components/layout/app-page-layout";
import { ListEmptyMessage } from "@/components/ui/list-empty-message";
import { buttonVariants } from "@/components/ui/button";
import type { Role } from "@/lib/auth/nav";
import { canViewExchanges } from "@/lib/auth/permissions";
import { listBatchesForStaff } from "@/lib/repos/exchange-batches";
import { closeOpenCartsForCycle } from "@/lib/repos/exchange-close";
import { cn } from "@/lib/utils";

export default async function ExchangesPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!canViewExchanges(role) || !userId || !role) {
    return <ForbiddenMessage />;
  }

  const now = new Date();
  await closeOpenCartsForCycle(now);
  const { batches, availableFromDay } = await listBatchesForStaff({
    role,
    userId,
  });

  const t = await getTranslations("exchanges");

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <div className={APP_LIST_PAGE_HEADER_ROW_CLASS}>
        <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{t("title")}</h1>
      </div>

      {batches.length === 0 ? (
        <div className="space-y-2">
          <ListEmptyMessage>{t("empty")}</ListEmptyMessage>
          {availableFromDay != null ? (
            <p className="text-sm text-muted-foreground">
              {t("availableFrom", { day: availableFromDay })}
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {batches.map((batch) => (
            <li
              key={batch.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="space-y-1">
                <p className="font-heading text-lg font-semibold">
                  {t("monthLabel", { month: batch.month, year: batch.year })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("orderCount", { count: batch.orderCount })} ·{" "}
                  {t("itemCount", { count: batch.totalItemCount })} ·{" "}
                  {t("total")}:{" "}
                  <span className="tabular-nums font-medium text-foreground">
                    {batch.totalNumberOf}
                  </span>
                </p>
              </div>
              <Link
                href={`/exchanges/${batch.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t("viewBatch")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
