import { and, count, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";

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

export type MediaCategory =
  | "avatar"
  | "face"
  | "award"
  | "currency"
  | "branding"
  | "route_theme"
  | "document"
  | "other";

export type MediaSensitivity = "public" | "internal" | "biometric";

export type MediaAssetRecord = {
  id: string;
  storageKey: string;
  url: string;
  browserUrl: string | null;
  mimeType: string | null;
  byteSize: number | null;
  originalFilename: string | null;
  displayName: string | null;
  description: string | null;
  altText: string | null;
  title: string | null;
  category: MediaCategory;
  sensitivity: MediaSensitivity;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaMimeFilter = "all" | "image" | "pdf";

export type MediaReferenceSectionKey =
  | "awards"
  | "users"
  | "currency"
  | "routeThemes"
  | "preferences";

export type MediaReference = {
  kind: "userAvatar" | "userFace" | "award" | "currency" | "routeTheme" | "branding";
  label: string;
  sectionKey: MediaReferenceSectionKey;
};

export type MediaReferenceSummary = Pick<MediaReference, "label" | "sectionKey">;

export type InsertMediaAssetOptions = {
  originalFilename?: string | null;
  displayName?: string | null;
  description?: string | null;
  altText?: string | null;
  title?: string | null;
  category?: MediaCategory;
  sensitivity?: MediaSensitivity;
};

export type MediaAssetMetadataInput = {
  displayName?: string | null;
  description?: string | null;
  altText?: string | null;
  title?: string | null;
  category?: MediaCategory;
};

const MEDIA_ASSET_COLUMNS = {
  id: mediaAssets.id,
  storageKey: mediaAssets.storageKey,
  url: mediaAssets.url,
  mimeType: mediaAssets.mimeType,
  byteSize: mediaAssets.byteSize,
  originalFilename: mediaAssets.originalFilename,
  displayName: mediaAssets.displayName,
  description: mediaAssets.description,
  altText: mediaAssets.altText,
  title: mediaAssets.title,
  category: mediaAssets.category,
  sensitivity: mediaAssets.sensitivity,
  createdAt: mediaAssets.createdAt,
  updatedAt: mediaAssets.updatedAt,
} as const;

function mapMediaAssetRow(row: {
  id: string;
  storageKey: string;
  url: string;
  mimeType: string | null;
  byteSize: number | null;
  originalFilename: string | null;
  displayName: string | null;
  description: string | null;
  altText: string | null;
  title: string | null;
  category: MediaCategory;
  sensitivity: MediaSensitivity;
  createdAt: Date;
  updatedAt: Date;
}): MediaAssetRecord {
  return {
    ...row,
    browserUrl: toBrowserMediaUrl(row.url),
  };
}

function displayNameFromFilename(filename: string | null | undefined): string | null {
  if (!filename?.trim()) return null;
  return filename.replace(/\.[^.]+$/, "").trim() || null;
}

function mediaReferenceSectionKey(
  kind: MediaReference["kind"],
): MediaReferenceSectionKey {
  switch (kind) {
    case "userAvatar":
    case "userFace":
      return "users";
    case "award":
      return "awards";
    case "currency":
      return "currency";
    case "routeTheme":
      return "routeThemes";
    case "branding":
      return "preferences";
  }
}

export async function listMediaAssets(
  options: {
    q?: string;
    mimeFilter?: MediaMimeFilter;
    category?: MediaCategory;
    includeBiometric?: boolean;
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
  if (!options.includeBiometric) {
    clauses.push(ne(mediaAssets.sensitivity, "biometric"));
  }
  if (options.category) {
    clauses.push(eq(mediaAssets.category, options.category));
  }
  if (options.mimeFilter === "image") {
    clauses.push(sql`${mediaAssets.mimeType} ilike 'image/%'`);
  } else if (options.mimeFilter === "pdf") {
    clauses.push(eq(mediaAssets.mimeType, "application/pdf"));
  }
  if (q) {
    clauses.push(
      or(
        ilike(mediaAssets.originalFilename, `%${q}%`),
        ilike(mediaAssets.displayName, `%${q}%`),
        ilike(mediaAssets.description, `%${q}%`),
        ilike(mediaAssets.altText, `%${q}%`),
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
    .select(MEDIA_ASSET_COLUMNS)
    .from(mediaAssets)
    .where(where)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    total: totalRow?.total ?? 0,
    items: rows.map(mapMediaAssetRow),
  };
}

export async function getMediaAsset(
  id: string,
  db: Db = getDb(),
): Promise<MediaAssetRecord | null> {
  const [row] = await db
    .select(MEDIA_ASSET_COLUMNS)
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);
  if (!row) return null;
  return mapMediaAssetRow(row);
}

export async function insertMediaAsset(
  stored: StoredMedia,
  options: InsertMediaAssetOptions = {},
  db: Db = getDb(),
): Promise<MediaAssetRecord> {
  const originalFilename = options.originalFilename ?? null;
  const displayName =
    options.displayName ?? displayNameFromFilename(originalFilename);
  const category = options.category ?? "other";
  const sensitivity = options.sensitivity ?? "public";

  const [row] = await db
    .insert(mediaAssets)
    .values({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      originalFilename,
      displayName,
      description: options.description ?? null,
      altText: options.altText ?? null,
      title: options.title ?? null,
      category,
      sensitivity,
    })
    .returning(MEDIA_ASSET_COLUMNS);
  return mapMediaAssetRow(row);
}

export async function replaceMediaAsset(
  id: string,
  stored: StoredMedia,
  options: InsertMediaAssetOptions = {},
  db: Db = getDb(),
): Promise<MediaAssetRecord> {
  const existing = await getMediaAsset(id, db);
  if (!existing) throw new Error("notFound");

  const originalFilename =
    options.originalFilename !== undefined
      ? options.originalFilename
      : existing.originalFilename;
  const displayName =
    options.displayName !== undefined
      ? options.displayName
      : existing.displayName ?? displayNameFromFilename(originalFilename);

  const [row] = await db
    .update(mediaAssets)
    .set({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      originalFilename,
      displayName,
      description:
        options.description !== undefined
          ? options.description
          : existing.description,
      altText:
        options.altText !== undefined ? options.altText : existing.altText,
      title: options.title !== undefined ? options.title : existing.title,
      category: options.category ?? existing.category,
      sensitivity: options.sensitivity ?? existing.sensitivity,
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, id))
    .returning(MEDIA_ASSET_COLUMNS);

  if (existing.storageKey !== stored.storageKey) {
    await deleteMediaObject(existing.storageKey);
  }

  return mapMediaAssetRow(row);
}

export async function updateMediaAssetMetadata(
  id: string,
  input: MediaAssetMetadataInput,
  db: Db = getDb(),
): Promise<MediaAssetRecord> {
  const existing = await getMediaAsset(id, db);
  if (!existing) throw new Error("notFound");
  if (existing.sensitivity === "biometric") {
    throw new Error("forbidden");
  }

  const [row] = await db
    .update(mediaAssets)
    .set({
      displayName:
        input.displayName !== undefined ? input.displayName : existing.displayName,
      description:
        input.description !== undefined ? input.description : existing.description,
      altText: input.altText !== undefined ? input.altText : existing.altText,
      title: input.title !== undefined ? input.title : existing.title,
      category: input.category ?? existing.category,
      updatedAt: new Date(),
    })
    .where(eq(mediaAssets.id, id))
    .returning(MEDIA_ASSET_COLUMNS);

  return mapMediaAssetRow(row);
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
    refs.push({
      kind: "userAvatar",
      label: user.name,
      sectionKey: mediaReferenceSectionKey("userAvatar"),
    });
  }

  const faceUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.facePhotoMediaId, id));
  for (const user of faceUsers) {
    refs.push({
      kind: "userFace",
      label: user.name,
      sectionKey: mediaReferenceSectionKey("userFace"),
    });
  }

  const awardRows = await db
    .select({ id: awards.id, name: awards.name })
    .from(awards)
    .where(eq(awards.imageMediaId, id));
  for (const award of awardRows) {
    refs.push({
      kind: "award",
      label: award.name,
      sectionKey: mediaReferenceSectionKey("award"),
    });
  }

  const currencyRows = await db
    .select({ id: currencies.id, name: currencies.name })
    .from(currencies)
    .where(eq(currencies.iconMediaId, id));
  for (const currency of currencyRows) {
    refs.push({
      kind: "currency",
      label: currency.name,
      sectionKey: mediaReferenceSectionKey("currency"),
    });
  }

  const themeRows = await db
    .select({ id: routeThemes.id, label: routeThemes.label })
    .from(routeThemes)
    .where(eq(routeThemes.backgroundImageMediaId, id));
  for (const theme of themeRows) {
    refs.push({
      kind: "routeTheme",
      label: theme.label,
      sectionKey: mediaReferenceSectionKey("routeTheme"),
    });
  }

  const [branding] = await db.select().from(appBrandingSettings).limit(1);
  if (branding) {
    const brandingSectionKey = mediaReferenceSectionKey("branding");
    if (branding.menuLogoMediaId === id) {
      refs.push({
        kind: "branding",
        label: "menuLogo",
        sectionKey: brandingSectionKey,
      });
    }
    if (branding.rankingFirstMediaId === id) {
      refs.push({
        kind: "branding",
        label: "rankingFirst",
        sectionKey: brandingSectionKey,
      });
    }
    if (branding.rankingSecondMediaId === id) {
      refs.push({
        kind: "branding",
        label: "rankingSecond",
        sectionKey: brandingSectionKey,
      });
    }
    if (branding.rankingThirdMediaId === id) {
      refs.push({
        kind: "branding",
        label: "rankingThird",
        sectionKey: brandingSectionKey,
      });
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
