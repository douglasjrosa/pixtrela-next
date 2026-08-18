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
import {
  loadResolvedBrandingAssets,
  updateMenuLogoMediaId,
} from "@/lib/repos/branding";
import {
  deleteMediaAsset,
  getMediaAsset,
  insertMediaAsset,
  listMediaAssets,
  replaceMediaAsset,
  type MediaAssetRecord,
  type MediaMimeFilter,
} from "@/lib/repos/media";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageSettings(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidateMediaLibrary(): void {
  revalidateTag("drizzle:media-assets", "default");
  revalidatePath("/settings/themes/files");
  revalidatePath("/settings/themes/preferences");
}

function invalidateBranding(): void {
  revalidateTag("drizzle:branding", "default");
  revalidatePath("/", "layout");
  revalidatePath("/settings/themes/preferences");
}

async function storeFromFormData(formData: FormData): Promise<{
  stored: Awaited<ReturnType<typeof storeMedia>>;
  originalFilename: string | null;
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
  const buffer = Buffer.from(await entry.arrayBuffer());
  const extension = extensionFromMime(mimeType, originalFilename);
  const stored = await storeMedia({ bytes: buffer, mimeType, extension });
  return { stored, originalFilename };
}

export async function listLibraryMedia(raw: {
  q?: string;
  mimeFilter?: MediaMimeFilter;
  page?: number;
  pageSize?: number;
}): Promise<{ items: MediaAssetRecord[]; total: number }> {
  await assertCanManage();
  return listMediaAssets({
    q: raw.q,
    mimeFilter: raw.mimeFilter ?? "all",
    page: raw.page,
    pageSize: raw.pageSize,
  });
}

export async function uploadLibraryMedia(
  formData: FormData,
): Promise<MediaAssetRecord> {
  await assertCanManage();
  const { stored, originalFilename } = await storeFromFormData(formData);
  const asset = await insertMediaAsset(stored, originalFilename);
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
  const { stored, originalFilename } = await storeFromFormData(formData);
  const asset = await replaceMediaAsset(mediaId, stored, originalFilename);
  invalidateMediaLibrary();
  invalidateBranding();
  return asset;
}

export async function deleteLibraryMedia(mediaId: string): Promise<void> {
  await assertCanManage();
  await deleteMediaAsset(mediaId);
  invalidateMediaLibrary();
}

export async function loadBrandingPreferences(): Promise<{
  menuLogoMediaId: string | null;
  menuLogoUrl: string | null;
}> {
  await assertCanManage();
  const branding = await loadResolvedBrandingAssets();
  return {
    menuLogoMediaId: branding.menuLogoMediaId,
    menuLogoUrl: branding.menuLogoUrl,
  };
}

export async function updateMenuLogo(
  menuLogoMediaId: string | null,
): Promise<void> {
  await assertCanManage();
  if (menuLogoMediaId) {
    const asset = await getMediaAsset(menuLogoMediaId);
    if (!asset) throw new Error("notFound");
    if (!asset.mimeType?.toLowerCase().startsWith("image/")) {
      throw new Error("unsupportedType");
    }
  }
  await updateMenuLogoMediaId(menuLogoMediaId);
  invalidateBranding();
}
