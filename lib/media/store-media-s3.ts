import { randomUUID } from "node:crypto";

import type { StoredMedia } from "./storage";

/**
 * Optional S3 backend. Loaded dynamically only when MEDIA_DRIVER=s3.
 */
export async function storeMediaS3(input: {
  bytes: Buffer;
  mimeType: string;
  extension: string;
}): Promise<StoredMedia> {
  const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET is required when MEDIA_DRIVER=s3");
  }

  const storageKey = `${randomUUID()}.${input.extension.replace(/^\./, "")}`;
  const client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: input.bytes,
      ContentType: input.mimeType,
    }),
  );

  const publicBase =
    process.env.S3_PUBLIC_URL?.replace(/\/$/, "") ||
    process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const url = publicBase
    ? `${publicBase}/${storageKey}`
    : `/api/media/${storageKey}`;

  return {
    storageKey,
    url,
    mimeType: input.mimeType,
    byteSize: input.bytes.byteLength,
  };
}
