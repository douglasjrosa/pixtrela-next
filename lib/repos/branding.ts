import { eq } from "drizzle-orm";

import { appBrandingSlots, mediaAssets } from "@/drizzle/schema";
import {
  BRANDING_SLOT_KEYS,
  type BrandingSlotConfig,
  type BrandingSlotKey,
  defaultBrandingSlotConfig,
  normalizeBrandingSlotConfig,
} from "@/lib/domain/branding-slots";
import { getDb, type Db } from "@/lib/db/client";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { brandingSlotUpsertSchema } from "@/lib/schemas/branding-slot";

export type BrandingSlotRecord = {
  key: BrandingSlotKey;
  mediaId: string | null;
  config: BrandingSlotConfig;
  updatedAt: Date;
};

export type ResolvedBrandingSlot = {
  key: BrandingSlotKey;
  mediaId: string | null;
  mediaUrl: string | null;
  config: BrandingSlotConfig;
};

export type ResolvedBranding = Record<BrandingSlotKey, ResolvedBrandingSlot>;

const SLOT_COLUMNS = {
  key: appBrandingSlots.key,
  mediaId: appBrandingSlots.mediaId,
  config: appBrandingSlots.config,
  updatedAt: appBrandingSlots.updatedAt,
} as const;

function mapSlotRow(row: {
  key: string;
  mediaId: string | null;
  config: Record<string, unknown> | null;
  updatedAt: Date;
}): BrandingSlotRecord {
  const key = row.key as BrandingSlotKey;
  return {
    key,
    mediaId: row.mediaId,
    config: normalizeBrandingSlotConfig(key, row.config ?? {}),
    updatedAt: row.updatedAt,
  };
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

function emptyResolvedBranding(): ResolvedBranding {
  return Object.fromEntries(
    BRANDING_SLOT_KEYS.map((key) => [
      key,
      {
        key,
        mediaId: null,
        mediaUrl: null,
        config: defaultBrandingSlotConfig(key),
      },
    ]),
  ) as ResolvedBranding;
}

export async function listBrandingSlots(
  db: Db = getDb(),
): Promise<BrandingSlotRecord[]> {
  const rows = await db.select(SLOT_COLUMNS).from(appBrandingSlots);
  return rows.map(mapSlotRow);
}

export async function getBrandingSlot(
  key: BrandingSlotKey,
  db: Db = getDb(),
): Promise<BrandingSlotRecord | null> {
  const [row] = await db
    .select(SLOT_COLUMNS)
    .from(appBrandingSlots)
    .where(eq(appBrandingSlots.key, key))
    .limit(1);
  return row ? mapSlotRow(row) : null;
}

export async function upsertBrandingSlot(
  input: {
    key: BrandingSlotKey;
    mediaId?: string | null;
    config?: BrandingSlotConfig;
  },
  db: Db = getDb(),
): Promise<BrandingSlotRecord> {
  const parsed = brandingSlotUpsertSchema.parse(input);
  const existing = await getBrandingSlot(parsed.key, db);
  const nextConfig = parsed.config
    ? normalizeBrandingSlotConfig(parsed.key, {
        ...(existing?.config ?? defaultBrandingSlotConfig(parsed.key)),
        ...parsed.config,
      })
    : (existing?.config ?? defaultBrandingSlotConfig(parsed.key));

  const [row] = await db
    .insert(appBrandingSlots)
    .values({
      key: parsed.key,
      mediaId:
        parsed.mediaId !== undefined ? parsed.mediaId : (existing?.mediaId ?? null),
      config: nextConfig,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appBrandingSlots.key,
      set: {
        ...(parsed.mediaId !== undefined ? { mediaId: parsed.mediaId } : {}),
        ...(parsed.config !== undefined ? { config: nextConfig } : {}),
        updatedAt: new Date(),
      },
    })
    .returning(SLOT_COLUMNS);

  return mapSlotRow(row);
}

export async function loadResolvedBranding(
  db: Db = getDb(),
): Promise<ResolvedBranding> {
  const rows = await listBrandingSlots(db);
  const resolved = emptyResolvedBranding();

  await Promise.all(
    rows.map(async (row) => {
      resolved[row.key] = {
        key: row.key,
        mediaId: row.mediaId,
        mediaUrl: await resolveMediaUrl(row.mediaId, db),
        config: row.config,
      };
    }),
  );

  return resolved;
}
