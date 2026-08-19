import { eq } from "drizzle-orm";

import { appBrandingSettings, mediaAssets } from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { normalizeOpacity } from "@/lib/themes/match-route-theme";

export type BrandingSettingsRecord = {
  id: string;
  menuLogoMediaId: string | null;
  menuLogoBackgroundColor: string | null;
  menuLogoBackgroundColorOpacity: number;
  rankingFirstMediaId: string | null;
  rankingSecondMediaId: string | null;
  rankingThirdMediaId: string | null;
};

export type ResolvedBrandingAssets = {
  menuLogoMediaId: string | null;
  menuLogoUrl: string | null;
  menuLogoBackgroundColor: string | null;
  menuLogoBackgroundColorOpacity: number;
  rankingFirstUrl: string | null;
  rankingSecondUrl: string | null;
  rankingThirdUrl: string | null;
};

const BRANDING_COLUMNS = {
  id: appBrandingSettings.id,
  menuLogoMediaId: appBrandingSettings.menuLogoMediaId,
  menuLogoBackgroundColor: appBrandingSettings.menuLogoBackgroundColor,
  menuLogoBackgroundColorOpacity:
    appBrandingSettings.menuLogoBackgroundColorOpacity,
  rankingFirstMediaId: appBrandingSettings.rankingFirstMediaId,
  rankingSecondMediaId: appBrandingSettings.rankingSecondMediaId,
  rankingThirdMediaId: appBrandingSettings.rankingThirdMediaId,
} as const;

function mapBrandingRow(row: {
  id: string;
  menuLogoMediaId: string | null;
  menuLogoBackgroundColor: string | null;
  menuLogoBackgroundColorOpacity: number | null;
  rankingFirstMediaId: string | null;
  rankingSecondMediaId: string | null;
  rankingThirdMediaId: string | null;
}): BrandingSettingsRecord {
  return {
    id: row.id,
    menuLogoMediaId: row.menuLogoMediaId,
    menuLogoBackgroundColor: row.menuLogoBackgroundColor,
    menuLogoBackgroundColorOpacity: normalizeOpacity(
      row.menuLogoBackgroundColorOpacity,
    ),
    rankingFirstMediaId: row.rankingFirstMediaId,
    rankingSecondMediaId: row.rankingSecondMediaId,
    rankingThirdMediaId: row.rankingThirdMediaId,
  };
}

async function getBrandingRow(db: Db): Promise<BrandingSettingsRecord | null> {
  const [row] = await db
    .select(BRANDING_COLUMNS)
    .from(appBrandingSettings)
    .limit(1);
  return row ? mapBrandingRow(row) : null;
}

async function ensureBrandingRow(db: Db): Promise<BrandingSettingsRecord> {
  const existing = await getBrandingRow(db);
  if (existing) return existing;
  const [created] = await db
    .insert(appBrandingSettings)
    .values({})
    .returning(BRANDING_COLUMNS);
  return mapBrandingRow(created);
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
      menuLogoBackgroundColor: null,
      menuLogoBackgroundColorOpacity: 0,
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
    menuLogoBackgroundColor: row.menuLogoBackgroundColor,
    menuLogoBackgroundColorOpacity: row.menuLogoBackgroundColorOpacity,
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
    .returning(BRANDING_COLUMNS);
  return mapBrandingRow(updated);
}

export async function updateMenuLogoBackground(
  input: {
    backgroundColor: string | null;
    backgroundColorOpacity: number;
  },
  db: Db = getDb(),
): Promise<BrandingSettingsRecord> {
  const row = await ensureBrandingRow(db);
  const [updated] = await db
    .update(appBrandingSettings)
    .set({
      menuLogoBackgroundColor: input.backgroundColor,
      menuLogoBackgroundColorOpacity: normalizeOpacity(
        input.backgroundColorOpacity,
      ),
      updatedAt: new Date(),
    })
    .where(eq(appBrandingSettings.id, row.id))
    .returning(BRANDING_COLUMNS);
  return mapBrandingRow(updated);
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
    .returning(BRANDING_COLUMNS);
  return mapBrandingRow(updated);
}
