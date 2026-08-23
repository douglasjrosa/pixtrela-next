import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ExchangeWindowBanner } from "@/components/exchange/exchange-window-banner";
import { CartEditor } from "@/components/store/cart-editor";
import { buttonVariants } from "@/components/ui/button";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { loadStorePage } from "@/lib/store/load-store-page";
import {
  buildStoreOrdersPath,
  buildStorePath,
} from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function ColaboratorStorePage({ params }: PageProps) {
  const tStore = await getTranslations("store");
  const tCart = await getTranslations("cart");
  const session = await auth();
  const { documentId } = await params;

  if (session?.user?.role !== "colaborator" || !session.user.id) {
    redirect("/");
  }

  if (session.user.id !== documentId) {
    redirect(buildStorePath(session.user.id));
  }

  const {
    catalogLines,
    spendableBalance,
    balance,
    windowOpen,
    team,
  } = await loadStorePage(documentId);

  const editorItems = catalogLines.map((item) => ({
    id: item.awardId,
    title: item.title,
    qty: item.qty,
    stock: item.stock,
    imageSrc: toBrowserMediaUrl(item.imageUrl),
    unitCost: item.unitCost,
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">{tStore("title")}</h1>
        <Link
          href={buildStoreOrdersPath(documentId)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {tStore("viewOrders")}
        </Link>
      </div>

      {team ? (
        <ExchangeWindowBanner
          windowOpen={windowOpen}
          firstDay={team.exchangesFirstDay}
          lastDay={team.exchangesLastDay}
        />
      ) : null}

      {team && windowOpen ? (
        <p className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
          {tCart("autoCloseBanner", { lastDay: team.exchangesLastDay })}
        </p>
      ) : null}

      {!windowOpen && catalogLines.some((item) => item.qty > 0) ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {tCart("readOnlyClosed")}
        </p>
      ) : null}

      {catalogLines.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-muted-foreground">{tCart("empty")}</p>
        </div>
      ) : (
        <CartEditor
          initialItems={editorItems}
          spendableBalance={spendableBalance}
          currencyLabel={balance.currencyLabel}
          editable={windowOpen}
        />
      )}
    </section>
  );
}
