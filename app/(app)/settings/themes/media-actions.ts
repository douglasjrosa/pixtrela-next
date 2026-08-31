"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageSettings } from "@/lib/auth/permissions";
import {
  extensionFromMime,
  isAllowedLibraryMime,
} from "@/lib/media/media-mime";
import { storeMedia } from "@/lib/media/store-media";
import type { BrandingSlotConfig } from "@/lib/domain/branding-slots";
import type { BrandingSlotKey } from "@/lib/domain/branding-slots";
import { upsertBrandingSlot } from "@/lib/repos/branding";
import { normalizeOpacity } from "@/lib/themes/match-route-theme";
import {
  deleteMediaAsset,
  findMediaReferences,
  getMediaAsset,
  insertMediaAsset,
  listMediaAssets,
  replaceMediaAsset,
  updateMediaAssetMetadata,
  type MediaAssetMetadataInput,
  type MediaAssetRecord,
  type MediaCategory,
  type MediaMimeFilter,
  type MediaReferenceSummary,
} from "@/lib/repos/media";

const LIBRARY_CATEGORIES: ReadonlySet<MediaCategory> = new Set([
  "avatar",
  "face",
  "award",
  "currency",
  "branding",
  "route_theme",
  "document",
  "other",
]);

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateMediaLibrary(): void {
  revalidateTag("drizzle:media-assets", "default");
  revalidatePath("/settings/files");
  revalidatePath("/settings/themes/preferences");
}

function invalidateBranding(): void {
  revalidateTag("drizzle:branding", "default");
  revalidatePath("/", "layout");
  revalidatePath("/settings/themes/preferences");
}

function parseCategory(raw: FormDataEntryValue | null | undefined): MediaCategory | null {
  if (typeof raw !== "string") return null;
  return LIBRARY_CATEGORIES.has(raw as MediaCategory)
    ? (raw as MediaCategory)
    : null;
}

function defaultLibraryCategory(mimeType: string): MediaCategory {
  return mimeType === "application/pdf" ? "document" : "other";
}

function normalizeMenuLogoHexColor(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/^#([0-9A-Fa-f]{6})$/.test(trimmed)) {
    throw new Error("invalid");
  }
  return trimmed.toUpperCase();
}

async function storeFromFormData(formData: FormData): Promise<{
  stored: Awaited<ReturnType<typeof storeMedia>>;
  originalFilename: string | null;
  category: MediaCategory;
}> {
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "application/octet-stream";
  if (!isAllowedLibraryMime(mimeType)) {
    throw new Error("unsupportedType");
  }
  const originalFilename =
    "name" in entry && typeof entry.name === "string" && entry.name.trim()
      ? entry.name.trim()
      : null;
  const category =
    parseCategory(formData.get("category")) ?? defaultLibraryCategory(mimeType);
  const buffer = Buffer.from(await entry.arrayBuffer());
  const extension = extensionFromMime(mimeType, originalFilename);
  const stored = await storeMedia({ bytes: buffer, mimeType, extension });
  return { stored, originalFilename, category };
}

export async function listLibraryMedia(raw: {
  q?: string;
  mimeFilter?: MediaMimeFilter;
  category?: MediaCategory;
  page?: number;
  pageSize?: number;
}): Promise<{ items: MediaAssetRecord[]; total: number }> {
  await assertCanManage();
  return listMediaAssets({
    q: raw.q,
    mimeFilter: raw.mimeFilter ?? "all",
    category: raw.category,
    includeBiometric: false,
    page: raw.page,
    pageSize: raw.pageSize,
  });
}

export async function uploadLibraryMedia(
  formData: FormData,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  const { stored, originalFilename, category } = await storeFromFormData(formData);
  const asset = await insertMediaAsset(stored, {
    originalFilename,
    category,
    sensitivity: "public",
  });
  invalidateMediaLibrary();
  return asset;
}

export async function replaceLibraryMedia(
  mediaId: string,
  formData: FormData,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  const existing = await getMediaAsset(mediaId);
  if (!existing) throw new Error("notFound");
  if (existing.sensitivity === "biometric") throw new Error("forbidden");
  const { stored, originalFilename } = await storeFromFormData(formData);
  const asset = await replaceMediaAsset(mediaId, stored, {
    originalFilename,
    category: existing.category,
    sensitivity: existing.sensitivity,
  });
  invalidateMediaLibrary();
  invalidateBranding();
  return asset;
}

export async function updateLibraryMediaMetadata(
  mediaId: string,
  input: MediaAssetMetadataInput,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  const asset = await updateMediaAssetMetadata(mediaId, input);
  invalidateMediaLibrary();
  return asset;
}

export async function deleteLibraryMedia(
  mediaId: string,
): Promise<
  | { ok: true }
  | { ok: false; reason: "inUse" | "notFound"; refs: MediaReferenceSummary[] }
> {
  await assertCanManage();
  const existing = await getMediaAsset(mediaId);
  if (!existing) {
    return { ok: false, reason: "notFound", refs: [] };
  }
  if (existing.sensitivity === "biometric") {
    return { ok: false, reason: "inUse", refs: [] };
  }
  const refs = await findMediaReferences(mediaId);
  if (refs.length > 0) {
    return {
      ok: false,
      reason: "inUse",
      refs: refs.map(({ label, sectionKey }) => ({ label, sectionKey })),
    };
  }
  await deleteMediaAsset(mediaId);
  invalidateMediaLibrary();
  return { ok: true };
}

export async function updateBrandingSlotMedia(
  key: BrandingSlotKey,
  mediaId: string | null,
): Promise<void> {
  await assertCanManage();
  if (mediaId) {
    const asset = await getMediaAsset(mediaId);
    if (!asset) throw new Error("notFound");
    if (!asset.mimeType?.toLowerCase().startsWith("image/")) {
      throw new Error("unsupportedType");
    }
  }
  await upsertBrandingSlot({ key, mediaId });
  invalidateBranding();
}

export async function updateBrandingSlotConfig(
  key: BrandingSlotKey,
  config: BrandingSlotConfig,
): Promise<void> {
  await assertCanManage();
  const normalized: BrandingSlotConfig = { ...config };
  if (normalized.backgroundColor !== undefined) {
    normalized.backgroundColor = normalizeMenuLogoHexColor(
      normalized.backgroundColor,
    );
  }
  if (normalized.backgroundColorOpacity !== undefined) {
    normalized.backgroundColorOpacity = normalizeOpacity(
      normalized.backgroundColorOpacity,
    );
  }
  if (normalized.displayOpacity !== undefined) {
    normalized.displayOpacity = normalizeOpacity(normalized.displayOpacity);
  }
  await upsertBrandingSlot({ key, config: normalized });
  invalidateBranding();
}
