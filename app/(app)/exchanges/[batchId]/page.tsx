import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { DeliverySheetsPrint } from "@/components/exchanges/delivery-sheets-print";
import { ShoppingListPrint } from "@/components/exchanges/shopping-list-print";
import {
  APP_LIST_PAGE_HEADER_ROW_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
} from "@/components/layout/app-page-layout";
import { BackLink } from "@/components/navigation/back-link";
import type { Role } from "@/lib/auth/nav";
import { canViewExchanges } from "@/lib/auth/permissions";
import { formatMonthYearPtBr } from "@/lib/format/datetime";
import { getBatchDetailForStaff } from "@/lib/repos/exchange-batches";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default async function ExchangeBatchDetailPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!canViewExchanges(role) || !userId || !role) {
    return <ForbiddenMessage />;
  }

  const { batchId } = await params;
  const detail = await getBatchDetailForStaff({
    batchId,
    role,
    userId,
  });
  if (!detail) notFound();

  const t = await getTranslations("exchanges");

  return (
    <section className={cn(APP_LIST_PAGE_SHELL_CLASS, "gap-8")}>
      <div className={cn(APP_LIST_PAGE_HEADER_ROW_CLASS, "no-print")}>
        <div className="space-y-2">
          <BackLink href="/exchanges" className="no-print -ml-2">
            {t("backToList")}
          </BackLink>
          <h1 className={APP_LIST_PAGE_TITLE_CLASS}>
            {t("batchTitle", {
              monthYear: formatMonthYearPtBr(detail.month, detail.year),
            })}
          </h1>
        </div>
      </div>

      <ShoppingListPrint
        lines={detail.shoppingList}
        batchId={detail.id}
        month={detail.month}
        year={detail.year}
      />
      <DeliverySheetsPrint
        deliveries={detail.deliveries}
        batchId={detail.id}
        month={detail.month}
        year={detail.year}
      />
    </section>
  );
}
