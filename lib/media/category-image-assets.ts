import { storeMedia } from "@/lib/media/store-media";
import {
  insertMediaAsset,
  listMediaAssets,
  type MediaAssetRecord,
  type MediaCategory,
} from "@/lib/repos/media";

const IMAGE_LIBRARY_PAGE = 1;
const IMAGE_LIBRARY_PAGE_SIZE = 100;

export async function listCategoryImageAssets(
  category: MediaCategory,
): Promise<MediaAssetRecord[]> {
  const result = await listMediaAssets({
    mimeFilter: "image",
    category,
    includeBiometric: false,
    page: IMAGE_LIBRARY_PAGE,
    pageSize: IMAGE_LIBRARY_PAGE_SIZE,
  });
  return result.items;
}

export async function uploadCategoryImageAsset(
  formData: FormData,
  category: MediaCategory,
): Promise<MediaAssetRecord> {
  const entry = formData.get("file");
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/jpeg";
  const buffer = Buffer.from(await entry.arrayBuffer());
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const stored = await storeMedia({ bytes: buffer, mimeType, extension });
  const originalFilename =
    "name" in entry && typeof entry.name === "string" && entry.name.trim()
      ? entry.name.trim()
      : null;
  return insertMediaAsset(stored, {
    originalFilename,
    category,
    sensitivity: "public",
  });
}
