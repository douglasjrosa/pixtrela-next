import { NextResponse } from "next/server";

import { isAllowedStrapiMediaUrl } from "@/lib/kiosk/face/is-allowed-strapi-media-url";

const STRAPI_URL = (process.env.STRAPI_URL ?? "http://127.0.0.1:1337").replace(
  /\/$/,
  "",
);

function resolveUpstreamTarget(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (path) {
    if (!path.startsWith("/uploads/")) return null;
    return `${STRAPI_URL}${path}`;
  }

  const url = searchParams.get("url");
  if (!url || !isAllowedStrapiMediaUrl(url, STRAPI_URL)) return null;
  return url;
}

/**
 * Same-origin proxy for Strapi uploads (browser <img> and face-api).
 * Accepts `path=/uploads/...` or absolute `url=` from the Strapi origin.
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
