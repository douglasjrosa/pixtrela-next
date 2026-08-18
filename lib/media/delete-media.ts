import { unlink } from "node:fs/promises";

import { resolveLocalMediaPath } from "./storage";

/**
 * Deletes a stored media object. Local filesystem or S3 based on MEDIA_DRIVER.
 */
export async function deleteMediaObject(storageKey: string): Promise<void> {
  const driver = process.env.MEDIA_DRIVER?.trim().toLowerCase();
  if (driver !== "s3") {
    const absolute = resolveLocalMediaPath(storageKey);
    try {
      await unlink(absolute);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      if (code !== "ENOENT") throw error;
    }
    return;
  }

  try {
    const { deleteMediaS3 } = await import("./delete-media-s3");
    await deleteMediaS3(storageKey);
  } catch {
    throw new Error(
      "S3 media driver requires @aws-sdk/client-s3 and S3_* env vars",
    );
  }
}
