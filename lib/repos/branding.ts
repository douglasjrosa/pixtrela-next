import { eq } from "drizzle-orm";

import { appBrandingSettings, mediaAssets } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export type BrandingSettingsRecord = {
  id: string;
  menuLogoMediaId: string | null;
  rankingFirstMediaId: string | null;
  rankingSecondMediaId: string | null;
  rankingThirdMediaId: string | null;
};

export type ResolvedBrandingAssets = {
  menuLogoMediaId: string | null;
  menuLogoUrl: string | null;
  rankingFirstUrl: string | null;
  rankingSecondUrl: string | null;
  rankingThirdUrl: string | null;
};

async function getBrandingRow(db: Db): Promise<BrandingSettingsRecord | null> {
  const [row] = await db
    .select({
      id: appBrandingSettings.id,
      menuLogoMediaId: appBrandingSettings.menuLogoMediaId,
      rankingFirstMediaId: appBrandingSettings.rankingFirstMediaId,
      rankingSecondMediaId: appBrandingSettings.rankingSecondMediaId,
      rankingThirdMediaId: appBrandingSettings.rankingThirdMediaId,
    })
    .from(appBrandingSettings)
    .limit(1);
  return row ?? null;
}

async function ensureBrandingRow(db: Db): Promise<BrandingSettingsRecord> {
  const existing = await getBrandingRow(db);
  if (existing) return existing;
  const [created] = await db
    .insert(appBrandingSettings)
    .values({})
    .returning({
      id: appBrandingSettings.id,
      menuLogoMediaId: appBrandingSettings.menuLogoMediaId,
      rankingFirstMediaId: appBrandingSettings.rankingFirstMediaId,
      rankingSecondMediaId: appBrandingSettings.rankingSecondMediaId,
      rankingThirdMediaId: appBrandingSettings.rankingThirdMediaId,
    });
  return created;
}

async function resolveMediaUrl(
  mediaId: string | null,
  db: Db,
): Promise<string | null> {
  if (!mediaId) return null;
  const [row] = await db
    .select({ url: mediaAssets.url })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, mediaId))
    .limit(1);
  return toBrowserMediaUrl(row?.url ?? null);
}

export async function loadResolvedBrandingAssets(
  db: Db = getDb(),
): Promise<ResolvedBrandingAssets> {
  const row = await getBrandingRow(db);
  if (!row) {
    return {
      menuLogoMediaId: null,
      menuLogoUrl: null,
      rankingFirstUrl: null,
      rankingSecondUrl: null,
      rankingThirdUrl: null,
    };
  }
  const [menuLogoUrl, rankingFirstUrl, rankingSecondUrl, rankingThirdUrl] =
    await Promise.all([
      resolveMediaUrl(row.menuLogoMediaId, db),
      resolveMediaUrl(row.rankingFirstMediaId, db),
      resolveMediaUrl(row.rankingSecondMediaId, db),
      resolveMediaUrl(row.rankingThirdMediaId, db),
    ]);
  return {
    menuLogoMediaId: row.menuLogoMediaId,
    menuLogoUrl,
    rankingFirstUrl,
    rankingSecondUrl,
    rankingThirdUrl,
  };
}

export async function updateMenuLogoMediaId(
  menuLogoMediaId: string | null,
  db: Db = getDb(),
): Promise<BrandingSettingsRecord> {
  const row = await ensureBrandingRow(db);
  const [updated] = await db
    .update(appBrandingSettings)
    .set({
      menuLogoMediaId,
      updatedAt: new Date(),
    })
    .where(eq(appBrandingSettings.id, row.id))
    .returning({
      id: appBrandingSettings.id,
      menuLogoMediaId: appBrandingSettings.menuLogoMediaId,
      rankingFirstMediaId: appBrandingSettings.rankingFirstMediaId,
      rankingSecondMediaId: appBrandingSettings.rankingSecondMediaId,
      rankingThirdMediaId: appBrandingSettings.rankingThirdMediaId,
    });
  return updated;
}

export async function upsertBrandingMediaIds(
  input: {
    menuLogoMediaId?: string | null;
    rankingFirstMediaId?: string | null;
    rankingSecondMediaId?: string | null;
    rankingThirdMediaId?: string | null;
  },
  db: Db = getDb(),
): Promise<BrandingSettingsRecord> {
  const row = await ensureBrandingRow(db);
  const [updated] = await db
    .update(appBrandingSettings)
    .set({
      ...(input.menuLogoMediaId !== undefined
        ? { menuLogoMediaId: input.menuLogoMediaId }
        : {}),
      ...(input.rankingFirstMediaId !== undefined
        ? { rankingFirstMediaId: input.rankingFirstMediaId }
        : {}),
      ...(input.rankingSecondMediaId !== undefined
        ? { rankingSecondMediaId: input.rankingSecondMediaId }
        : {}),
      ...(input.rankingThirdMediaId !== undefined
        ? { rankingThirdMediaId: input.rankingThirdMediaId }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(appBrandingSettings.id, row.id))
    .returning({
      id: appBrandingSettings.id,
      menuLogoMediaId: appBrandingSettings.menuLogoMediaId,
      rankingFirstMediaId: appBrandingSettings.rankingFirstMediaId,
      rankingSecondMediaId: appBrandingSettings.rankingSecondMediaId,
      rankingThirdMediaId: appBrandingSettings.rankingThirdMediaId,
    });
  return updated;
}
