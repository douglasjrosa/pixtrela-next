import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { CartEditor } from "@/components/store/cart-editor";
import { StoreMyListCard } from "@/components/store/store-my-list-card";
import { StoreWindowInfoCard } from "@/components/store/store-window-info-card";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { listSavedCartItems } from "@/lib/store/list-saved-cart-items";
import { loadStorePage } from "@/lib/store/load-store-page";
import { STORE_PAGE_SHELL_CLASS } from "@/lib/store/store-layout";
import { buildStorePath } from "@/lib/store/store-path";
import { loadBrandingForLayout } from "@/lib/themes/load-branding";

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

  const [{ cards, currencies, windowOpen, team }, branding] = await Promise.all([
    loadStorePage(documentId),
    loadBrandingForLayout(),
  ]);
  const cartWatermarkSlot = branding.cart_watermark;

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
  const savedListItems = listSavedCartItems(cards).map((item) => ({
    ...item,
    imageUrl: toBrowserMediaUrl(item.imageUrl),
    lines: item.lines.map((line) => ({
      ...line,
      iconUrl: toBrowserMediaUrl(line.iconUrl),
    })),
  }));

  return (
    <section className={STORE_PAGE_SHELL_CLASS}>
      <h1 className="font-heading text-2xl font-bold">{tStore("title")}</h1>

      {team ? (
        <StoreWindowInfoCard
          windowOpen={windowOpen}
          firstDay={team.exchangesFirstDay}
          lastDay={team.exchangesLastDay}
        />
      ) : !windowOpen ? (
        <p
          className={
            "rounded-2xl border border-destructive/30 " +
            "bg-destructive/5 px-4 py-3 text-sm text-destructive"
          }
        >
          {tCart("readOnlyClosed")}
        </p>
      ) : null}

      <CartEditor
        initialAwards={editorAwards}
        currencies={currencies}
        editable={windowOpen}
        cartWatermark={{
          url: cartWatermarkSlot.mediaUrl,
          displayOpacity: cartWatermarkSlot.config.displayOpacity,
          widthPercent: cartWatermarkSlot.config.widthPercent,
        }}
      >
        <StoreMyListCard items={savedListItems} />
      </CartEditor>
    </section>
  );
}
