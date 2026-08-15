import { NextResponse } from "next/server";

import { isAllowedMediaUrl } from "@/lib/kiosk/face/is-allowed-media-url";

function resolveUpstreamTarget(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return null;
  if (!isAllowedMediaUrl(url)) return null;
  return url;
}

/**
 * Same-origin proxy for trusted public media (browser <img> and face-api).
 */
export async function GET(request: Request): Promise<Response> {
  const target = resolveUpstreamTarget(request);
  if (!target) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
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
