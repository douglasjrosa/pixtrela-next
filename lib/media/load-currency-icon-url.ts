import { eq } from "drizzle-orm";

import { currencies, mediaAssets } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export async function loadCurrencyIconUrlByPluralTitle(
  currencyPluralTitle: string,
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db
    .select({ url: mediaAssets.url })
    .from(currencies)
    .leftJoin(mediaAssets, eq(currencies.iconMediaId, mediaAssets.id))
    .where(eq(currencies.pluralTitle, currencyPluralTitle))
    .limit(1);

  return toBrowserMediaUrl(row?.url ?? null);
}
