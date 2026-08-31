import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { buildOrderPath, buildOrdersPath } from "@/lib/orders/orders-path";
import { getOrderForUser } from "@/lib/repos/exchange-orders";
import { buildStorePath } from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ documentId: string; orderId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ColaboratorOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const t = await getTranslations("orders");
  const session = await auth();
  const { documentId, orderId } = await params;
  const query = await searchParams;
  const placed = query.placed === "1" || query.placed?.[0] === "1";

  if (session?.user?.role !== "colaborator" || !session.user.id) {
    redirect("/");
  }
  if (session.user.id !== documentId) {
    redirect(buildOrderPath(session.user.id, orderId));
  }

  const order = await getOrderForUser(documentId, orderId);
  if (!order) {
    return (
      <section className="space-y-4">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link
          href={buildOrdersPath(documentId)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("backToOrders")}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {placed ? (
        <p
          role="status"
          className={
            "rounded-2xl bg-[var(--star-gold-muted)] px-4 py-3 text-sm " +
            "font-semibold text-[var(--star-gold-foreground)]"
          }
        >
          {t("placed")}
        </p>
      ) : null}

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">{t("detailTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDateTimePtBr(order.checkedOutAt.toISOString())}
        </p>
        <p className="text-sm font-medium">
          {order.status === "completed"
            ? t("statusCompleted")
            : t("statusCancelled")}
        </p>
      </div>

      <ul className="space-y-2">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{item.awardTitle}</p>
              <p className="text-muted-foreground">
                {t("qty")} {item.qty} · {t("unit")} {item.unitNumberOf}
              </p>
            </div>
            <CurrencyAmount
              iconUrl={order.currencyIconUrl}
              className="tabular-nums font-semibold"
            >
              {item.lineNumberOf}
            </CurrencyAmount>
          </li>
        ))}
      </ul>

      <div className="flex justify-between rounded-2xl bg-[var(--star-gold-muted)] px-4 py-3 text-lg font-bold text-[var(--star-gold-foreground)]">
        <span>{t("total")}</span>
        <CurrencyAmount
          iconUrl={order.currencyIconUrl}
          iconSize="md"
          className="tabular-nums"
        >
          {order.totalNumberOf} {order.currencyPluralTitle}
        </CurrencyAmount>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={buildOrdersPath(documentId)}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("backToOrders")}
        </Link>
        <Link
          href={buildStorePath(documentId)}
          className={cn(buttonVariants({ variant: "default" }))}
        >
          {t("backToStore")}
        </Link>
      </div>
    </section>
  );
}
