import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import {
  appBrandingSettings,
  awards,
  currencies,
  mediaAssets,
  routeThemes,
  users,
} from "@/drizzle/schema";
import { getDb, type Db } from "@/lib/db/client";
import { deleteMediaObject } from "@/lib/media/delete-media";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import type { StoredMedia } from "@/lib/media/storage";

export type MediaAssetRecord = {
  id: string;
  storageKey: string;
  url: string;
  browserUrl: string | null;
  mimeType: string | null;
  byteSize: number | null;
  originalFilename: string | null;
  createdAt: Date;
};

export type MediaMimeFilter = "all" | "image" | "pdf";

export type MediaReference = {
  kind: "userAvatar" | "userFace" | "award" | "currency" | "routeTheme" | "branding";
  label: string;
};

export async function listMediaAssets(
  options: {
    q?: string;
    mimeFilter?: MediaMimeFilter;
    page?: number;
    pageSize?: number;
  } = {},
  db: Db = getDb(),
): Promise<{ items: MediaAssetRecord[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 24));
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();

  const clauses: SQL[] = [];
  if (options.mimeFilter === "image") {
    clauses.push(sql`${mediaAssets.mimeType} ilike 'image/%'`);
  } else if (options.mimeFilter === "pdf") {
    clauses.push(eq(mediaAssets.mimeType, "application/pdf"));
  }
  if (q) {
    clauses.push(
      or(
        ilike(mediaAssets.originalFilename, `%${q}%`),
        ilike(mediaAssets.storageKey, `%${q}%`),
        ilike(mediaAssets.mimeType, `%${q}%`),
      )!,
    );
  }
  const where = clauses.length > 0 ? and(...clauses) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(mediaAssets)
    .where(where);

  const rows = await db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      url: mediaAssets.url,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      originalFilename: mediaAssets.originalFilename,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .where(where)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    total: totalRow?.total ?? 0,
    items: rows.map((row) => ({
      ...row,
      browserUrl: toBrowserMediaUrl(row.url),
    })),
  };
}

export async function getMediaAsset(
  id: string,
  db: Db = getDb(),
): Promise<MediaAssetRecord | null> {
  const [row] = await db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      url: mediaAssets.url,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      originalFilename: mediaAssets.originalFilename,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row, browserUrl: toBrowserMediaUrl(row.url) };
}

export async function insertMediaAsset(
  stored: StoredMedia,
  originalFilename: string | null = null,
  db: Db = getDb(),
): Promise<MediaAssetRecord> {
  const [row] = await db
    .insert(mediaAssets)
    .values({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      originalFilename,
    })
    .returning({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      url: mediaAssets.url,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      originalFilename: mediaAssets.originalFilename,
      createdAt: mediaAssets.createdAt,
    });
  return { ...row, browserUrl: toBrowserMediaUrl(row.url) };
}

export async function replaceMediaAsset(
  id: string,
  stored: StoredMedia,
  originalFilename: string | null = null,
  db: Db = getDb(),
): Promise<MediaAssetRecord> {
  const existing = await getMediaAsset(id, db);
  if (!existing) throw new Error("notFound");

  const [row] = await db
    .update(mediaAssets)
    .set({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      originalFilename,
    })
    .where(eq(mediaAssets.id, id))
    .returning({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      url: mediaAssets.url,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      originalFilename: mediaAssets.originalFilename,
      createdAt: mediaAssets.createdAt,
    });

  if (existing.storageKey !== stored.storageKey) {
    await deleteMediaObject(existing.storageKey);
  }

  return { ...row, browserUrl: toBrowserMediaUrl(row.url) };
}

export async function findMediaReferences(
  id: string,
  db: Db = getDb(),
): Promise<MediaReference[]> {
  const refs: MediaReference[] = [];

  const avatarUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.avatarMediaId, id));
  for (const user of avatarUsers) {
    refs.push({ kind: "userAvatar", label: user.name });
  }

  const faceUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.facePhotoMediaId, id));
  for (const user of faceUsers) {
    refs.push({ kind: "userFace", label: user.name });
  }

  const awardRows = await db
    .select({ id: awards.id, name: awards.name })
    .from(awards)
    .where(eq(awards.imageMediaId, id));
  for (const award of awardRows) {
    refs.push({ kind: "award", label: award.name });
  }

  const currencyRows = await db
    .select({ id: currencies.id, name: currencies.name })
    .from(currencies)
    .where(eq(currencies.iconMediaId, id));
  for (const currency of currencyRows) {
    refs.push({ kind: "currency", label: currency.name });
  }

  const themeRows = await db
    .select({ id: routeThemes.id, label: routeThemes.label })
    .from(routeThemes)
    .where(eq(routeThemes.backgroundImageMediaId, id));
  for (const theme of themeRows) {
    refs.push({ kind: "routeTheme", label: theme.label });
  }

  const [branding] = await db.select().from(appBrandingSettings).limit(1);
  if (branding) {
    if (branding.menuLogoMediaId === id) {
      refs.push({ kind: "branding", label: "menuLogo" });
    }
    if (branding.rankingFirstMediaId === id) {
      refs.push({ kind: "branding", label: "rankingFirst" });
    }
    if (branding.rankingSecondMediaId === id) {
      refs.push({ kind: "branding", label: "rankingSecond" });
    }
    if (branding.rankingThirdMediaId === id) {
      refs.push({ kind: "branding", label: "rankingThird" });
    }
  }

  return refs;
}

export async function deleteMediaAsset(
  id: string,
  db: Db = getDb(),
): Promise<void> {
  const existing = await getMediaAsset(id, db);
  if (!existing) throw new Error("notFound");

  const refs = await findMediaReferences(id, db);
  if (refs.length > 0) {
    throw new Error("inUse");
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  await deleteMediaObject(existing.storageKey);
}
