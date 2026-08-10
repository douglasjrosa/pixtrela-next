import { Readable } from "node:stream";
import { createReadStream, existsSync } from "node:fs";
import { NextResponse } from "next/server";

import { resolveLocalMediaPath } from "@/lib/media/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
): Promise<NextResponse> {
  const { key } = await context.params;
  const absolute = resolveLocalMediaPath(key);
  if (!existsSync(absolute)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return new NextResponse(webStream, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
