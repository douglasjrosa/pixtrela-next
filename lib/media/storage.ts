import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type StoredMedia = {
  storageKey: string;
  url: string;
  mimeType: string;
  byteSize: number;
};

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

/**
 * Local filesystem media store (dev). Prod can swap for S3 via MEDIA_DRIVER=s3.
 */
export async function storeMediaLocal(input: {
  bytes: Buffer;
  mimeType: string;
  extension: string;
}): Promise<StoredMedia> {
  const id = randomUUID();
  const storageKey = `${id}.${input.extension.replace(/^\./, "")}`;
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const absolute = path.join(UPLOAD_ROOT, storageKey);
  await writeFile(absolute, input.bytes);
  return {
    storageKey,
    url: `/api/media/${storageKey}`,
    mimeType: input.mimeType,
    byteSize: input.bytes.byteLength,
  };
}

export function resolveLocalMediaPath(storageKey: string): string {
  const safe = path.basename(storageKey);
  return path.join(UPLOAD_ROOT, safe);
}
