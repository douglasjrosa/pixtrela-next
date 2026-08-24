import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ExchangeWindowBanner } from "@/components/exchange/exchange-window-banner";
import { CartEditor } from "@/components/store/cart-editor";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { loadStorePage } from "@/lib/store/load-store-page";
import { buildStorePath } from "@/lib/store/store-path";

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

  const { cards, currencies, windowOpen, team } =
    await loadStorePage(documentId);

  const editorAwards = cards.map((card) => ({
    awardId: card.awardId,
    title: card.title,
    stock: card.stock,
    imageSrc: toBrowserMediaUrl(card.imageUrl),
    prices: card.prices.map((price) => ({
      ...price,
      iconUrl: toBrowserMediaUrl(price.iconUrl),
    })),
  }));

  return (
    <section className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{tStore("title")}</h1>

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

      {!windowOpen ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {tCart("readOnlyClosed")}
        </p>
      ) : null}

      {editorAwards.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-muted-foreground">{tCart("empty")}</p>
        </div>
      ) : (
        <CartEditor
          initialAwards={editorAwards}
          currencies={currencies}
          editable={windowOpen}
        />
      )}
    </section>
  );
}
