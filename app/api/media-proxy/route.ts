import { NextResponse } from "next/server";

import { isTrustedPublicMediaUrl } from "@/lib/media/trusted-public-origin";

/**
 * Same-origin proxy for trusted public media (R2 CDN without CORS).
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || !isTrustedPublicMediaUrl(url)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
