import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { buildOrderPath, buildOrdersPath } from "@/lib/orders/orders-path";
import { listOrdersForUser } from "@/lib/repos/exchange-orders";
import { buildStorePath } from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function ColaboratorOrdersPage({ params }: PageProps) {
  const t = await getTranslations("orders");
  const tStore = await getTranslations("store");
  const session = await auth();
  const { documentId } = await params;

  if (session?.user?.role !== "colaborator" || !session.user.id) {
    redirect("/");
  }
  if (session.user.id !== documentId) {
    redirect(buildOrdersPath(session.user.id));
  }

  const orders = await listOrdersForUser(documentId, 50);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{t("title")}</h1>
        <Link
          href={buildStorePath(documentId)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {tStore("title")}
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={buildOrderPath(documentId, order.id)}
                className={
                  "block space-y-1 rounded-2xl border bg-card px-4 py-3 " +
                  "transition-colors hover:bg-muted/40"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-heading font-semibold">
                    {order.itemCount === 1
                      ? t("itemSingular", { count: order.itemCount })
                      : t("items", { count: order.itemCount })}
                  </p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {order.status === "completed"
                      ? t("statusCompleted")
                      : t("statusCancelled")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatDateTimePtBr(order.checkedOutAt.toISOString())}
                  </span>
                  <span className="tabular-nums font-bold text-[var(--star-gold-foreground)]">
                    {order.totalNumberOf} {order.currencyPluralTitle}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
