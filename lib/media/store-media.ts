import { storeMediaLocal, type StoredMedia } from "./storage";

/**
 * Stores media. Default: local filesystem.
 * Optional S3: set MEDIA_DRIVER=s3 and install `@aws-sdk/client-s3`.
 */
export async function storeMedia(input: {
  bytes: Buffer;
  mimeType: string;
  extension: string;
}): Promise<StoredMedia> {
  const driver = process.env.MEDIA_DRIVER?.trim().toLowerCase();
  if (driver !== "s3") {
    return storeMediaLocal(input);
  }

  try {
    const { storeMediaS3 } = await import("./store-media-s3");
    return storeMediaS3(input);
  } catch {
    throw new Error(
      "S3 media driver requires @aws-sdk/client-s3 and S3_* env vars",
    );
  }
}
