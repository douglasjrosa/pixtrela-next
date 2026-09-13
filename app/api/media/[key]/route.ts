import { Readable } from "node:stream";
import { createReadStream, existsSync } from "node:fs";
import { NextResponse } from "next/server";

import { mimeFromStorageKey } from "@/lib/media/media-mime";
import { resolveLocalMediaPath } from "@/lib/media/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
): Promise<NextResponse> {
  const { key } = await context.params;
  const storageKey = decodeURIComponent(key);
  const absolute = resolveLocalMediaPath(storageKey);
  if (!existsSync(absolute)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  const contentType = mimeFromStorageKey(storageKey) ?? "application/octet-stream";
  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
